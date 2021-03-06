const {MerkleTreeNodeModel, MerkleTreeNodeTypeEnum} = PandoraLibrary.dataStructures.merkleTree;

const {TxMerkleTreeNodeSchemaBuilt} = require('./schema/tx-merkle-tree-node-schema-build')

class TxMerkleTreeNodeModel extends MerkleTreeNodeModel {

    constructor(scope, schema = TxMerkleTreeNodeSchemaBuilt,  data, type, creationOptions){
        super(scope, schema, data, type, creationOptions);
        this._transaction = undefined;
    }

    get transaction(){

        if (this.type === MerkleTreeNodeTypeEnum.MERKLE_TREE_NODE || this.__data.pruned) return;

        if (!this._transaction)
            this._transaction = this._scope.chain.transactionsValidator.cloneTx( this.data );


        return this._transaction;

    }

}

TxMerkleTreeNodeSchemaBuilt.fields.children.modelClass = TxMerkleTreeNodeModel;

module.exports = TxMerkleTreeNodeModel;
