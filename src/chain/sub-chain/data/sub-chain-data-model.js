const {Helper, Exception} = PandoraLibrary.helpers;

const BaseChainDataModel = require( "../../base/base-chain-data-model");
const BlockModel = require( "../../../block/block-model")

const {SubChainDataSchemaBuilt} = require('./sub-chain-data-schema-build')

module.exports = class SubChainDataModel extends BaseChainDataModel {

    constructor(scope, schema = SubChainDataSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    async clearData(){

        await super.clearData(this);

        this.listBlocks = [];
        this.listHashes = [];

    }

}