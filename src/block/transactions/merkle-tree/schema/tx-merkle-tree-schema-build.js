const {MerkleTreeSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeSchemaBuild;
const {Helper} = require('kernel').helpers;

const {TxMerkleTreeRootSchemaBuilt} = require("./tx-merkle-tree-root-schema-build");
const TxMerkleTreeRootModel = require('../tx-merkle-tree-root-model')

class TxMerkleTreeSchemaBuild extends MerkleTreeSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "TxMerkle",
                    minSize: 8,
                    maxSize: 8,
                },

                id: {

                    default(){
                        return "m_"+this.block.height.toString();
                    },

                    maxSize: 12,
                    minSize: 3,

                },

                root:{
                    modelClass: TxMerkleTreeRootModel,
                },


            },

        }, schema, false) );
    }

}

module.exports = {
    TxMerkleTreeSchemaBuild,
    TxMerkleTreeSchemaBuilt: new TxMerkleTreeSchemaBuild(),
}