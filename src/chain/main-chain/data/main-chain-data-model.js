
const {Helper, Exception} = require('kernel').helpers;
const {MarshalData} = require('kernel').marshal;

const BaseChainDataModel = require( "../../base/base-chain-data-model");

const {MainChainDataSchemaBuilt} = require('./main-chain-data-schema-build')

module.exports = class MainChainDataModel extends BaseChainDataModel {

    constructor(scope, schema = MainChainDataSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }


    validateChainwork(subChainChainwork, subChainEnd){

        if ( Buffer.isBuffer(subChainChainwork) )
            subChainChainwork = MarshalData.decompressBigNumber( subChainChainwork );

        /**
         * if chainwork is less than current chainwork then fails
         */

        if ( this.chainwork.gt(subChainChainwork) ) return -1;

        /**
         * if chainwork is equal to the current chainwork and it has less blocks than fails
         */

        if ( this.chainwork.eq(subChainChainwork) ){

            if ( this.end > subChainEnd ) return -1;
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

            this.tokenNameMap.clearHashMap(),
            this.tokenTickerMap.clearHashMap(),

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

            this.tokenNameMap.saveVirtualMap(),
            this.tokenTickerMap.saveVirtualMap(),
        ];

        await Promise.all(promises);

    }

}