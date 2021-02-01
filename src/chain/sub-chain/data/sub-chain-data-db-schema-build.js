const {BaseChainDataDBSchemaBuild} = require('../../base/base-chain-data-db-schema-build')
const {Helper} = require('kernel').helpers;

const {SubChainDataHashUniqueDBSchemaBuilt} = require( "./hash/sub-chain-data-hash-unique-db-schema-build");
const {SubChainDataKernelHashUniqueDBSchemaBuilt} = require( "./hash/sub-chain-data-kernel-hash-unique-db-schema-build");

const BlockDBModel = require("../../../block/block-db-model")

class SubChainDataDBSchemaBuild extends BaseChainDataDBSchemaBuild {

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
                    modelClass: BlockDBModel,

                    position: 200,
                },

                listHashes: {
                    type: "array",
                    maxSize(){
                        return this._scope.argv.blockchain.maxForkAllowed;
                    },
                    schemaBuiltClass: SubChainDataHashUniqueDBSchemaBuilt,

                    position: 201,
                },

                listKernelHashes: {
                    type: "array",
                    maxSize(){
                        return this._scope.argv.blockchain.maxForkAllowed;
                    },
                    schemaBuiltClass: SubChainDataKernelHashUniqueDBSchemaBuilt,

                    position: 202,
                },

            }

        }, schema, true));

    }

}

module.exports = {
    SubChainDataDBSchemaBuild,
    SubChainDataDBSchemaBuilt: new SubChainDataDBSchemaBuild()
}