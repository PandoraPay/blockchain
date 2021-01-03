import Block from "../../block/block";
import TransactionsMerkleTreeNode from "../../block/transactions/merkle-tree/transactions-merkle-tree-node"

const {Helper, Exception} = global.kernel.helpers;
const {MarshalData} = global.kernel.marshal;

import BaseChainData from "./../base/base-chain-data";

export default class MainChainData extends BaseChainData {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "mainchain",
                        fixedBytes: 9,
                    },

                    id: {
                        default: "main",
                        fixedBytes: 4,
                    },

                    version: {
                        default: 0,
                    },

                    beingSaved:{
                        type: "boolean",
                        default: false,
                        position: 1000,
                    }

                }

            },
            schema, false), data, type, creationOptions);

        this.clearOnlyLocalBlocks();

    }

    clearOnlyLocalBlocks(){
        this.blocksMap = {};
        this.blocksHashesMap = {};
        this.transactionsHashesMap = {};
    }


    validateChainwork(subchainChainwork, subchainEnd){

        if ( Buffer.isBuffer(subchainChainwork) )
            subchainChainwork = MarshalData.decompressBigNumber( subchainChainwork );

        /**
         * if chainwork is less than current chainwork then fails
         */

        if ( this.chainwork.gt(subchainChainwork) ) return -1;

        /**
         * if chainwork is equal to the current chainwork and it has less blocks than fails
         */

        if ( this.chainwork.eq(subchainChainwork) ){

            if ( this.end > subchainEnd ) return -1;
            else return 0;

        }

        return 1;

    }


    async clearData(){

        this._scope.logger.info(this, "Delete hash maps");

        //delete maps
        const promises = [

            this.blockHashMap.clearHashMap(),
            this.hashBlockMap.clearHashMap(),

            this.txHashMap.clearHashMap(),
            this.txRevertInfoHashMap.clearHashMap(),
            this.addressHashMap.clearHashMap(),
            this.addressTxHashMap.clearHashMap(),

            this.accountHashMap.clearHashMap(),
            this.tokenHashMap.clearHashMap(),

            this.tokenNameHashMap.clearHashMap(),
            this.tokenTickerHashMap.clearHashMap(),

        ];

        await Promise.all(promises);

        //let's delete blocks
        const blockPromises = [];


        this._scope.logger.info(this, "Deleting block");
        for (let i=0; i < this.end; i ++)
            try{
                blockPromises.push( this.deleteBlock(i) );
            }catch(err){

            }

        await Promise.all(blockPromises);
        this._scope.logger.info(this, "Deleting block finished");

        await this.accountHashMap.updateBalance( this._scope.genesis.settings.stakes.publicKeyHash, this._scope.argv.transactions.coinbase.getBlockRewardAt( 0 ) );

        await super.clearData(this);

    }

    async saveState(){


        /**
         * Maps and RadixTree are virtual
         */

        const promises = [
            this.blockHashMap.saveVirtualMap(),
            this.hashBlockMap.saveVirtualMap(),

            this.txHashMap.saveVirtualMap(),
            this.txRevertInfoHashMap.saveVirtualMap(),
            this.addressHashMap.saveVirtualMap(),
            this.addressTxHashMap.saveVirtualMap(),

            this.accountHashMap.saveVirtualMap(),
            this.tokenHashMap.saveVirtualMap(),

            this.tokenNameHashMap.saveVirtualMap(),
            this.tokenTickerHashMap.saveVirtualMap(),

        ];

        await Promise.all(promises);

    }




    async getBlock( height  = this.end - 1 ){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, end: this.end});

        if (this.blocksMap[height]) return this.blocksMap[height];

        const block  = new Block( this._scope, undefined, {
            height: height
        } );
        await block.load();

        return block;

    }

    async deleteBlock(height){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, length: this.length});

        try{
            const block = await this.getBlock(height);
            await block.delete();
            return true;
        }catch(err){

        }

    }

    async getBlockHash(height){

        if (this.blocksMap[height]) return this.blocksMap[height].hash();

        const element = await this.blockHashMap.getMap( height.toString() );

        if (!element) throw new Exception(this, "Block not found", {height});

        return element.data;

    }

    async getBlockByHash( hash ){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");

        if (this.blocksHashesMap[hash]) return this.blocksHashesMap[hash];

        const element = await this.hashBlockMap.getMap( hash );

        if (!element) throw new Exception(this, "Block not found", {hash});

        const blockHeight = element.data;

        return this.getBlock(blockHeight);

    }

    async getTransactionByHash(hash){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (!hash || hash.length !== 64) throw new Exception(this, "Hash is invalid");

        if (this.transactionsHashesMap[hash]) return this.transactionsHashesMap[hash];

        const hashExistence = await this.txHashMap.getMap( hash, );
        if (!hashExistence) return undefined;

        const blockHeight = hashExistence.data.blockHeight;
        const merkleHeight = hashExistence.data.merkleHeight;

        const txMerkleNode  = new TransactionsMerkleTreeNode( {
            ...this._scope,
            parent: {
                tree: {
                    levelsCounts: [merkleHeight],
                    levels: 0,
                },
                level: -1,
                __changes: {},
                _propagateChanges: a=>a,
                _propagateHashingChanges: a => a,
            },
            parentFieldName: "children",
        }, undefined, { } );

        await txMerkleNode.load(undefined, `block:b_${blockHeight}:Tmerkle:m_${blockHeight}`);

        return {
            tx: txMerkleNode.transaction,
            block: blockHeight,
            blockTimestamp: hashExistence.data.blockTimestamp,
            merkleLeafHeight: hashExistence.data.merkleLeafHeight,
        };
    }


}