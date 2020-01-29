const {MerkleTreeNode, MerkleTreeNodeTypeEnum} = global.kernel.dataStructures.merkleTree;
const {Helper, Exception} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

export default class TransactionsMerkleTreeNode extends MerkleTreeNode {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "TNode",
                    fixedBytes: 6,
                },

                children: {
                    classObject: TransactionsMerkleTreeNode,
                },
                

            },

        }, schema, false), data, type, creationOptions);

        this._transaction = undefined;

    }

    get transaction(){

        if (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned) return;

        if (!this._transaction)
            this._transaction = this._scope.chain.transactionsValidator.validateTx( this.data );


        return this._transaction;

    }

}