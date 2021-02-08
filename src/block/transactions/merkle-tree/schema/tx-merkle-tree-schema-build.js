const {MerkleTreeSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeSchemaBuild;
const {Helper} = require('kernel').helpers;

const {TxMerkleTreeRootSchemaBuilt} = require("./tx-merkle-tree-root-schema-build");
const TxMerkleTreeRootModel = require('../tx-merkle-tree-root-model')

class TxMerkleTreeSchemaBuild extends MerkleTreeSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "Merkle",
                    minSize: 6,
                    maxSize: 6,
                },

                id: {
                    default: "TxMerkleTree",

                    maxSize: 12,
                    minSize: 12,
                },

                root:{
                    modelClass: TxMerkleTreeRootModel,
                },


            },

        }, schema, false) );
    }

}

module.exports = {
    TxMerkleTreeSchemaBuild,
    TxMerkleTreeSchemaBuilt: new TxMerkleTreeSchemaBuild(),
}