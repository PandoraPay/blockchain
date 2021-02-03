const {MerkleTreeRootModel} = require('kernel').dataStructures.merkleTree;
const {Helper, Exception} = require('kernel').helpers;

const TxMerkleTreeNodeModel = require( "./tx-merkle-tree-node-model")

module.exports = class TxMerkleTreeRootModel extends MerkleTreeRootModel {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    modelClass: TxMerkleTreeNodeModel,
                }

            },


        }, schema, false), data, type, creationOptions);


    }
    

}