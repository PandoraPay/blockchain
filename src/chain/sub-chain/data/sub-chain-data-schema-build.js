const {BaseChainDataSchemaBuild} = require('../../base/base-chain-data-schema-build')
const {Helper} = PandoraLibrary.helpers;

const {SubChainDataHashUniqueSchemaBuilt} = require( "./hash/sub-chain-data-hash-unique-schema-build");
const {SubChainDataKernelHashUniqueSchemaBuilt} = require( "./hash/sub-chain-data-kernel-hash-unique-schema-build");

const BlockModel = require("../../../block/block-model")

class SubChainDataSchemaBuild extends BaseChainDataSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "chain",
                    minSize: 5,
                    maxSize: 5,
                },

                version: {
                    default: 0,
                },

                listBlocks: {
                    type: "array",
                    maxSize(){
                        return this._scope.argv.blockchain.maxForkAllowed
                    },
                    modelClass: BlockModel,

                    position: 200,
                },

                listHashes: {
                    type: "array",
                    maxSize(){
                        return this._scope.argv.blockchain.maxForkAllowed;
                    },
                    schemaBuiltClass: SubChainDataHashUniqueSchemaBuilt,

                    position: 201,
                },

            }

        }, schema, true));

    }

}

module.exports = {
    SubChainDataSchemaBuild,
    SubChainDataSchemaBuilt: new SubChainDataSchemaBuild()
}