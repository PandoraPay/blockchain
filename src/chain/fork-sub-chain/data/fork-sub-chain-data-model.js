const SubChainDataModel = require( "../../sub-chain/data/sub-chain-data-model");
const {Helper, Exception} = require('kernel').helpers;

const {ForkSubChainDataSchemaBuilt} = require('./fork-sub-chain-data-schema-build')

module.exports = class ForkSubChainDataModel extends SubChainDataModel {

    constructor(scope, schema = ForkSubChainDataSchemaBuilt, data, type , creationOptions){

        super(scope, schema, data, type, creationOptions);
        this.errorDownload = 0;

        this.underlineFork = undefined;
        this.sockets = {};
        this.socketsList = [];

    }

    isReady(){
        return this.ready && !this.processing && !this.underlineFork;
    }

    score(){
        return this.chainwork;
    }


}