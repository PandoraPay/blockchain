const {MerkleTreeRootDBModel} = require('kernel').dataStructures.merkleTree;
const {Helper, Exception} = require('kernel').helpers;

const TransactionsMerkleTreeNodeDBModel = require( "./transactions-merkle-tree-node-db-model")

module.exports = class TransactionsMerkleTreeRoot extends MerkleTreeRootDBModel {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    modelClass: TransactionsMerkleTreeNodeDBModel,
                }

            },


        }, schema, false), data, type, creationOptions);


    }
    

}