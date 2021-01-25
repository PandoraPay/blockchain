const {MerkleTreeNode, MerkleTreeNodeTypeEnum} = require('kernel').dataStructures.merkleTree;
const {MerkleTreeRoot} = require('kernel').dataStructures.merkleTree;
const {Helper, Exception} = require('kernel').helpers;

const TransactionsMerkleTreeNode = require( "./transactions-merkle-tree-node")

module.exports = class TransactionsMerkleTreeRoot extends MerkleTreeRoot {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    classObject: TransactionsMerkleTreeNode,
                }

            },


        }, schema, false), data, type, creationOptions);


    }
    

}