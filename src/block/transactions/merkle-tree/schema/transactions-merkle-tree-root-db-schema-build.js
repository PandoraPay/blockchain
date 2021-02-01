const {MerkleTreeRootDBSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeRootDBSchemaBuild;
const {MerkleTreeRoot} = require('kernel').dataStructures.merkleTree;
const {Helper, Exception} = require('kernel').helpers;

const TransactionsMerkleTreeRootDBModel = require('../transactions-merkle-tree-root-db-model')

module.exports = class TransactionsMerkleTreeRootDBSchemaBuild extends MerkleTreeRootDBSchemaBuild {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    modelClass: TransactionsMerkleTreeRootDBModel,
                }

            },

        }, schema, false), data, type, creationOptions);

    }

}

module.exports = {
    TransactionsMerkleTreeRootDBSchemaBuild,
    TransactionsMerkleTreeRootDBSchemaBuilt: new TransactionsMerkleTreeRootDBSchemaBuild()
}