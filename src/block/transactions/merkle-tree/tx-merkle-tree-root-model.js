const {MerkleTreeRootModel} = require('kernel').dataStructures.merkleTree;
const {Helper, Exception} = require('kernel').helpers;

const TxMerkleTreeNodeModel = require( "./tx-merkle-tree-node-model")

const {TxMerkleTreeRootSchemaBuilt} = require('./schema/tx-merkle-tree-root-schema-build')

module.exports = class TxMerkleTreeRootModel extends MerkleTreeRootModel {

    constructor(scope, schema = TxMerkleTreeRootSchemaBuilt,  data, type, creationOptions){
        super(scope, schema, data, type, creationOptions);
    }
    

}

TxMerkleTreeRootSchemaBuilt.fields.children.modelClass = TxMerkleTreeNodeModel;
