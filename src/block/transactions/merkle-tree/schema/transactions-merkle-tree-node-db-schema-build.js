const {MerkleTreeNodeDBSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeNodeDBSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const TransactionsMerkleTreeNodeDBModel = require('../transactions-merkle-tree-node-db-model')

class TransactionsMerkleTreeNodeDBSchemaBuild extends MerkleTreeNodeDBSchemaBuild {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    modelClass: TransactionsMerkleTreeNodeDBModel,
                },

            },

        }, schema, false), data, type, creationOptions);

    }


}

module.exports = {
    TransactionsMerkleTreeNodeDBSchemaBuild,
    TransactionsMerkleTreeNodeDBSchemaBuilt: new TransactionsMerkleTreeNodeDBSchemaBuild()
}