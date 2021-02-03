const {MerkleTreeRootSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeRootSchemaBuild;
const {MerkleTreeRoot} = require('kernel').dataStructures.merkleTree;
const {Helper, Exception} = require('kernel').helpers;

const TxMerkleTreeRootModel = require('../tx-merkle-tree-root-model')

module.exports = class TransactionsMerkleTreeRootSchemaBuild extends MerkleTreeRootSchemaBuild {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    modelClass: TxMerkleTreeRootModel,
                }

            },

        }, schema, false), data, type, creationOptions);

    }

}

module.exports = {
    TransactionsMerkleTreeRootSchemaBuild,
    TransactionsMerkleTreeRootSchemaBuilt: new TransactionsMerkleTreeRootSchemaBuild()
}