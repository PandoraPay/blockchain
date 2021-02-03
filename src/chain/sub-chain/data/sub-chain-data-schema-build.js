const {BaseChainDataSchemaBuild} = require('../../base/base-chain-data-schema-build')
const {Helper} = require('kernel').helpers;

const {SubChainDataHashUniqueSchemaBuilt} = require( "./hash/sub-chain-data-hash-unique-schema-build");
const {SubChainDataKernelHashUniqueSchemaBuilt} = require( "./hash/sub-chain-data-kernel-hash-unique-schema-build");

const BlockModel = require("../../../block/block-model")

class SubChainDataSchemaBuild extends BaseChainDataSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "chain",
                    fixedBytes: 5,
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

                listKernelHashes: {
                    type: "array",
                    maxSize(){
                        return this._scope.argv.blockchain.maxForkAllowed;
                    },
                    schemaBuiltClass: SubChainDataKernelHashUniqueSchemaBuilt,

                    position: 202,
                },

            }

        }, schema, true));

    }

}

module.exports = {
    SubChainDataSchemaBuild,
    SubChainDataSchemaBuilt: new SubChainDataSchemaBuild()
}