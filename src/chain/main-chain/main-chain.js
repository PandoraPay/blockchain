import ForkSubChain from "../fork-sub-chain/fork-sub-chain";

const {Exception} = global.kernel.helpers;
const {MarshalData} = global.kernel.marshal;
const {DBSchema} = global.kernel.marshal.db;

import Block from "src/block/block"
import BaseChain from "../base/base-chain"
import SubChain from "../sub-chain/sub-chain"
import MainChainData from "./main-chain-data"

export default class MainChain extends BaseChain {

    constructor( scope){

        super(scope );

        this._init = false;
        this.isMainChain = true;

        this.dataSubscription = new DBSchema(this._scope);

    }

    /**
     * Initializing Main Chain
     * @returns {Promise<boolean>}
     */
    async initializeChain(){

        if ( this._init ) return true;

        this._scope.logger.log(this, "Initializing Main Chain");

        let cleared = false;

        if (BROWSER) return true;

        try{

            await this._loadChain();

            //check if the chain was saved successfully.
            if (this.data.beingSaved){
                this._scope.logger.error(this, "MainChain was not saved successfully. It will ");
                return false;
            }

            if (this.data.end === 0) {
                cleared = true;
                await this.clear();
            }

        } catch (err){
            this._scope.logger.error(this, "Error loading MainChain", err);
        }

        if (this._scope.argv.blockchain.genesisTestNet.createNewTestNet )
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMasterCluster) {

                if (!cleared) {
                    cleared = true;
                    await this.clear();
                }

            }


        if ( this._scope.db.isSynchronized ) {

            await this.dataSubscription.subscribe();
            this.dataSubscription.subscription.on( async message => {
                
                if (message.name === "update-main-chain"){

                    this._scope.logger.warn(this, "update-main-chain", message.data.end-1 );

                    this.data.end = message.data.end;
                    this.data.start = message.data.start;
                    this.data.chainwork = MarshalData.decompressBigNumber( Buffer.from( message.data.chainwork) );
                    this.data.hash = Buffer.from(message.data.hash );
                    this.data.prevHash = Buffer.from( message.data.prevHash );
                    this.data.kernelHash = Buffer.from( message.data.kernelHash );
                    this.data.prevKernelHash = Buffer.from( message.data.prevKernelHash );

                    //let's reset the virtual HashMaps and AccountTree
                    this.data.resetState();

                    this.emit("blocks/included", {
                        data: { end: this.data.end},
                        senderSockets: {},
                    });
                }

            });

        }

        //this._scope.logger.log(this, "Initialized successfully");

        this._init = true;
        return true;

    }

    async _clearData(){

        await super._clearData();
        this.data.beingSaved = false;
    }

    /**
     * Clear entire Blockchain
     */
    async clear(){

        await this._clearData();

        await this.data.save();
        await this.data.saveState();

        this._scope.logger.warn(this, "Main Chain data cleared");

    }

    /**
     * Add already validated blocks to blockchain
     * Blocks must be validated already using a subchain
     *
     * A lock is used to avoid processing multiple chains in the same time
     *
     */
    async addBlocks(blocks, senderSockets){

        if (!blocks) return false;
        if (!Array.isArray(blocks)) blocks = [blocks];
        if (blocks.length === 0) return false;

        let result = true;

        this._scope.logger.warn(this, 'Locking...', blocks.map( it => it.height ));

        let lock;
        if (this._scope.db.isSynchronized)
            lock = await this.data.lock( -1,  );

        this._scope.logger.warn(this, 'Lock obtained', blocks.map( it => it.height ));

        //make a copy
        const oldData = this.data;

        const revertBackError = {
            saveBlocks: [],
            deleteBlocks: [],
        };

        try{

            const newData = this.cloneData();

            blocks = await this.filterIdenticalBlocks(blocks);

            //check if now we no longer have blocks
            if (blocks.length === 0) throw new Exception(this, "blocks are identical now");

            this._scope.logger.warn(this, 'Filtered Identical Blocks' );

            const blocksRemoved = await newData.spliceBlocks( blocks[0].height, );
            if (!blocksRemoved) throw new Exception(this, "error removing blocks");

            this._scope.logger.warn(this, 'Blocks Removed' );

            let successIndex;
            for (let i=0; i < blocks.length; i++){

                const block = blocks[i];

                const out = await block.addBlock(this, newData);
                if (!out){

                    this._scope.logger.info(this, "Block couldn't be added");

                    if (newData.chainwork.lte( oldData.chainwork )) //in case still the chainwork is greater
                        throw new Exception(this, "Success is false");

                    break;
                }

                //saving temporary blocks
                newData.blocksMap[block.height] = block;
                newData.blocksHashesMap[block.hash().toString("hex")] = block;

                const txs = await block.getTransactions();
                for (const tx of txs)
                    newData.transactionsHashesMap[tx.hash().toString("hex")] = tx;

                newData.end = newData.end + 1;
                newData.chainwork = newData.chainwork.add(  block.work );
                newData.hash = block.hash();
                newData.prevHash = block.prevHash;
                newData.kernelHash = block.kernelHash();
                newData.prevKernelHash = block.prevKernelHash;
                successIndex = i;

                this._scope.logger.warn(this, 'Block added', i );
            }

            if (successIndex === undefined) throw new Exception(this, "SuccessIndex is undefined");

            blocks = blocks.splice(0 , successIndex+1);


            //saving the blocks which will be removed from oldData
            for (let i=0; i < blocksRemoved.length; i++){
                const block = blocksRemoved[i];
                oldData.blocksHashesMap[block.hash().toString("hex")] = block;
                oldData.blocksMap[block.height] = block ;
                const txs = await block.getTransactions();
                for (const tx of txs)
                    oldData.transactionsHashesMap[tx.hash().toString("hex")] = tx;
            }

            //mark it is being saved
            oldData.beingSaved = true;
            await oldData.save();

            //removing old blocks
            try{

                for (const block of blocksRemoved ){

                    //successfully deleted
                    await block.delete();
                    revertBackError.saveBlocks.push(block);
                    //successfully removed
                    await block.successfullyRemoved( this, newData );
                }

            }catch(err){
               throw new Exception(this, "Error deleting block");
            }

            newData.beingSaved = true;

            //saving new blocks
            try{
                for (let i=0; i < blocks.length; i++){

                    this._scope.logger.warn(this, "saving block", blocks[i].height );

                    const block = blocks[i];
                    await block.save();
                    revertBackError.deleteBlocks.push(block);

                    this._scope.logger.warn(this, "saving block successfully added", blocks[i].height );
                    await block.successfullyAdded( this, newData );

                }
            }catch(err){
                throw new Exception(this, "Error deleting block");
            }

            //saving it
            //a lock is necessary to avoid sending corrupted data to other nodes like a block from previous chain.data and a block from the new block.data
            this.data = newData;

            /**
             * Successful
             */

            await newData.saveState();

            newData.beingSaved = false;
            await newData.save();

            newData.clearOnlyLocalBlocks();


            oldData.beingSaved = false; //oldData is no longer used, so it will not have any effect

            if (this._scope.db.isSynchronized )
                await this.dataSubscription.subscribeMessage("update-main-chain", {
                    start: newData.start,
                    end: newData.end,
                    chainwork: newData.chainworkBuffer,
                    hash: newData.hash,
                    prevHash: newData.prevHash,
                    kernelHash: newData.kernelHash,
                    prevKernelHash: newData.prevKernelHash,
                }, false);

            this._scope.logger.log(this, "emitting new block",  newData.chainwork.toString() );

            this.emit("blocks/included", {
                data: { blocks: blocks, end: this.end},
                senderSockets,
            });

            //TODO mark that the chain was saved correctly

        } catch (err){

            this._scope.logger.error(this, "addBlock raised an error", err);
            result = false;

            try{

                this.data = oldData;

                for (const block of revertBackError.deleteBlocks)
                    await block.delete();

                for (const block of revertBackError.saveBlocks)
                    await block.save();

                oldData.clearOnlyLocalBlocks();

                oldData.beingSaved = false;
                await oldData.save();

            }catch(err2){
                this._scope.logger.error(this, "addBlock catch error raised an error", err2);
            }

        }

        this._scope.logger.warn(this, 'Lock removed', blocks.map( it => it.height ));

        if (lock) await lock();

        return result;

    }

    async _loadChain(){

        await this.data.loadData();

        return true;
    }

    createForkSubChain(){

        const forkSubChain = new ForkSubChain({
            ...this._scope,
            mainChain: this,
        });

        forkSubChain.data.start = this.data.start;
        forkSubChain.data.end = this.data.end;
        forkSubChain.data.chainwork = this.data.chainwork;

        return forkSubChain;

    }

    createSubChain(){

        const subChain = new SubChain({
            ...this._scope,
            mainChain: this,
        });

        subChain.data.start = this.data.start;
        subChain.data.end = this.data.end;
        subChain.data.chainwork = this.data.chainwork;

        return subChain;

    }

    get _chainDataClass(){
        return MainChainData;
    }

}