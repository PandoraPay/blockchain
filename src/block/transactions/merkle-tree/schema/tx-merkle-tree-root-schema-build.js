const {MerkleTreeRootSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeRootSchemaBuild;
const {MerkleTreeRoot} = require('kernel').dataStructures.merkleTree;
const {Helper, Exception} = require('kernel').helpers;

class TxMerkleTreeRootSchemaBuild extends MerkleTreeRootSchemaBuild {

    constructor(schema){

        super(Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

            },

        }, schema, true));

    }

}

module.exports = {
    TxMerkleTreeRootSchemaBuild,
    TxMerkleTreeRootSchemaBuilt: new TxMerkleTreeRootSchemaBuild()
}