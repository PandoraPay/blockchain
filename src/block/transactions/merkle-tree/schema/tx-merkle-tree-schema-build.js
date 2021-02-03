const {MerkleTreeSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeSchemaBuild;
const {Helper} = require('kernel').helpers;

import {TransactionsMerkleTreeRootSchemaBuilt} from "./tx-merkle-tree-root-schema-build";
const TxMerkleTreeRootModel = require('../tx-merkle-tree-root-model')

class TxMerkleTreeSchemaBuild extends MerkleTreeSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "Tmerkle",
                    fixedBytes: 7,
                },

                id: {

                    default(){
                        return "m_"+this.block.height.toString();
                    },

                    maxSize: 12,
                    minSize: 3,

                },

                root:{
                    schemaBuiltClass: TransactionsMerkleTreeRootSchemaBuilt,
                    modelClass: TxMerkleTreeRootModel,
                },


            },

        }, schema, false) );
    }

}

module.exports = {
    TransactionsMerkleTreeSchemaBuild: TxMerkleTreeSchemaBuild,
    TransactionsMerkleTreeSchemaBuilt: new TxMerkleTreeSchemaBuild(),
}