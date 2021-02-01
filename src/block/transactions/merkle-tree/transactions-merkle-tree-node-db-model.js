const {MerkleTreeNodeDBModel, MerkleTreeNodeTypeEnum} = require('kernel').dataStructures.merkleTree;
const {CryptoHelper} = require('kernel').helpers.crypto;

module.exports = class TransactionsMerkleTreeNodeDBModel extends MerkleTreeNodeDBModel {

    constructor(scope, schema,  data, type, creationOptions){

        super(scope, schema, data, type, creationOptions);
        this._transaction = undefined;

    }

    get transaction(){

        if (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned) return;

        if (!this._transaction)
            this._transaction = this._scope.chain.transactionsValidator.validateTx( this.data );


        return this._transaction;

    }

}