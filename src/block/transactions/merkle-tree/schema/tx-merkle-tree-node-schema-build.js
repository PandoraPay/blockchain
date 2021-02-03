const {MerkleTreeNodeSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeNodeSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const TxMerkleTreeNodeModel = require('../tx-merkle-tree-node-model')

class TxMerkleTreeNodeSchemaBuild extends MerkleTreeNodeSchemaBuild {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    modelClass: TxMerkleTreeNodeModel,
                },

            },

        }, schema, false), data, type, creationOptions);

    }


}

module.exports = {
    TxMerkleTreeNodeSchemaBuild,
    TxMerkleTreeNodeSchemaBuilt: new TxMerkleTreeNodeSchemaBuild()
}