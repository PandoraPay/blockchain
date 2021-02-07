const BlockModel = require( "../../../block/block-model");
const TxMerkleTreeNodeModel = require( "../../../block/transactions/merkle-tree/tx-merkle-tree-node-model")

const {Helper, Exception} = require('kernel').helpers;
const {MarshalData} = require('kernel').marshal;

const BaseChainDataModel = require( "../../base/base-chain-data-model");

const {MainChainDataSchemaBuilt} = require('./main-chain-data-schema-build')

module.exports = class MainChainDataModel extends BaseChainDataModel {

    constructor(scope, schema = MainChainDataSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
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
            this.blockHeightMap.clearHashMap(),

            this.txInfoHashMap.clearHashMap(),
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

        await super.clearData(this);

    }

    async saveState(){


        /**
         * Maps and RadixTree are virtual
         */

        const promises = [
            this.blockHashMap.saveVirtualMap(),
            this.blockHeightMap.saveVirtualMap(),

            this.txInfoHashMap.saveVirtualMap(),
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

        const block  = new BlockModel( this._scope, undefined, {
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

        const element = await this.blockHeightMap.getMap( height.toString() );

        if (!element) throw new Exception(this, "Block not found", {height});

        return element.hash;

    }

    async getBlockByHash( hash ){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");

        if (this.blocksHashesMap[hash]) return this.blocksHashesMap[hash];

        const blockInfo = await this.blockHashMap.getMap( hash );

        if (!blockInfo) throw new Exception(this, "Block not found", {hash});

        return this.getBlock(blockInfo.height);

    }

    async getTransactionByHash(hash){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (!hash || hash.length !== 64) throw new Exception(this, "Hash is invalid");

        if (this.transactionsHashesMap[hash])
            return this.transactionsHashesMap[hash];

        const txInfo = await this.txInfoHashMap.getMap( hash, );
        if (!txInfo) return undefined;

        const txMerkleNode  = new TxMerkleTreeNodeModel( {
            ...this._scope,
            parent: {
                tree: {
                    levelsCounts: [txInfo.merkleHeight],
                    levels: 0,
                },
                level: -1,
            },
            parentFieldName: "children",
        }, undefined, { } );

        await txMerkleNode.load(undefined, `block:b_${txInfo.blockHeight}:TxMerkl:m_${txInfo.merkleHeight}`);
        return txMerkleNode.transaction;
    }

    async getTransactionWithInfoByHash(hash){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (!hash || hash.length !== 64) throw new Exception(this, "Hash is invalid");

        const txInfo = await this.txInfoHashMap.getMap( hash, );
        if (!txInfo) return undefined;

        const out = {
            block: txInfo.blockHeight,
            blockTimestamp: txInfo.blockTimestamp,
            merkleLeafHeight: txInfo.merkleLeafHeight,
        }

        if (this.transactionsHashesMap[hash]){
            out.tx = this.transactionsHashesMap[hash].toBuffer();
            return out;
        }

        const txMerkleNode  = new TxMerkleTreeNodeModel( {
            ...this._scope,
            parent: {
                tree: {
                    levelsCounts: [txInfo.merkleHeight],
                    levels: 0,
                },
                level: -1,
            },
            parentFieldName: "children",
        }, undefined, { } );

        await txMerkleNode.load(undefined, `block:b_${txInfo.blockHeight}:TxMerkl:m_${txInfo.merkleHeight}`);
        out.tx = txMerkleNode.transaction;

        return out;
    }


}