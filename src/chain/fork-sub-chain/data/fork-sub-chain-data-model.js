const SubChainDataModel = require( "../../sub-chain/data/sub-chain-data-model");
const {Helper, Exception} = require('kernel').helpers;

const {ForkSubChainDataSchemaBuilt} = require('./fork-sub-chain-data-schema-build')

module.exports = class ForkSubChainDataModel extends SubChainDataModel {

    constructor(scope, schema = ForkSubChainDataSchemaBuilt, data, type , creationOptions){

        super(scope, schema, data, type, creationOptions);
        this.errorDownload = 0;

    }

    isReady(){
        return this.ready && !this.processing;
    }

    score(){
        return this.chainwork;
    }


}