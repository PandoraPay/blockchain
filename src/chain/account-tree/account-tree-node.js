const {RadixTreeNode, RadixTreeNodeTypeEnum} = global.kernel.dataStructures.radixTree;
const {Helper, Exception} = global.kernel.helpers;

import AccountTreeNodeData from "./data/account-tree-node-data";

export default class AccountTreeNode extends RadixTreeNode {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "accNode",
                    fixedBytes: 7,
                },

                data: {

                    type: "object",
                    classObject(){

                        if (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.pruned) return AccountTreeNodeData;
                        else undefined;

                    },

                    emptyAllowed(){
                        if (this.type === RadixTreeNodeTypeEnum.RADIX_TREE_LEAF && !this.pruned) return false;
                        else return true;
                    },

                    minSize(){},
                    maxSize(){},

                },

            },

        }, schema, false), data, type, creationOptions);

        this.nodeClass = AccountTreeNode;
        this.nodeClassData = AccountTreeNodeData;
        this.nodeClassDataEmpty = null;

    }

}