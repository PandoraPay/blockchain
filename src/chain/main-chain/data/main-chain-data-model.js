
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
        this.blocksMapByHeight = {};
        this.blocksMapByHash = {};
        this.transactionsMapByHash = {};
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

            this.blockByHashMap.clearHashMap(),
            this.blockByHeightMap.clearHashMap(),
            this.blockInfoByHashMap.clearHashMap(),

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

        this._scope.logger.info(this, "Deleting block", {end: this.end});
        for (let i=0; i < this.end; i ++)
                blockPromises.push( this.deleteBlockByHeight(i) );

        await Promise.all(blockPromises);
        this._scope.logger.info(this, "Deleting block finished");

        await super.clearData(this);

    }

    async saveState(){


        /**
         * Maps and RadixTree are virtual
         */

        const promises = [
            this.blockByHashMap.saveVirtualMap(),
            this.blockByHeightMap.saveVirtualMap(),
            this.blockInfoByHashMap.saveVirtualMap(),

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

    async _getBlockByHeight( height  = this.end - 1 ){

        if (this.blocksMapByHeight[height]) return this.blocksMapByHeight[height];
        return super._getBlockByHeight(height);
    }

    async _deleteBlockByHeight(height){

        if (this.blocksMapByHeight[height]){
            const block = this.blocksMapByHeight[height];
            delete this.blocksMapByHeight[height];
            delete this.blocksMapByHash[block.hash().toString('hex')];
        }

        return super._deleteBlockByHeight(height);
    }

    async _getBlockByHash(hash){
        if (this.blocksMapByHash[hash]) return this.blocksMapByHash[hash];
        return super._getBlockByHash(hash);
    }

    async _getBlockHashByHeight(height){
        if (this.blocksMapByHeight[height]) return this.blocksMapByHeight[height];
        return super._getBlockHashByHeight(height);
    }

    async _getBlockInfoByHash(hash){
        if (this.blocksMapByHash[hash]) return this.blocksMapByHash[hash].getBlockInfo();
        return super._getBlockInfoByHash(hash);
    }

    async _getTransactionByHash(hash){

        if (this.transactionsMapByHash[hash])
            return this.transactionsMapByHash[hash].tx;

        return super._getTransactionByHash(hash);
    }

    async _getTransactionWithInfoByHash(hash){

        if (this.transactionsMapByHash[hash])
            return this.transactionsMapByHash[hash];

        return super._getTransactionWithInfoByHash(hash);
    }

}