const {MerkleTreeNode, MerkleTreeNodeTypeEnum} = global.kernel.dataStructures.merkleTree;
const {MerkleTreeRoot} = global.kernel.dataStructures.merkleTree;
const {Helper, Exception} = global.kernel.helpers;

import TransactionsMerkleTreeNode from "./transactions-merkle-tree-node"

export default class TransactionsMerkleTreeRoot extends MerkleTreeRoot {

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