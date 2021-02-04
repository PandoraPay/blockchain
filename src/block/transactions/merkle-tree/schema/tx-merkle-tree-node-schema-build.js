const {MerkleTreeNodeSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeNodeSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

class TxMerkleTreeNodeSchemaBuild extends MerkleTreeNodeSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

            },

        }, schema, true) );

    }


}

module.exports = {
    TxMerkleTreeNodeSchemaBuild,
    TxMerkleTreeNodeSchemaBuilt: new TxMerkleTreeNodeSchemaBuild()
}