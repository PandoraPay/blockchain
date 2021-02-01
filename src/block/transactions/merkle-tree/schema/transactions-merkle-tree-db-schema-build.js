const {MerkleTreeDBSchemaBuild} = require('kernel').dataStructures.merkleTree.schema.MerkleTreeDBSchemaBuild;
const {Helper} = require('kernel').helpers;

import {TransactionsMerkleTreeRootDBSchemaBuilt} from "./transactions-merkle-tree-root-db-schema-build";
const TransactionsMerkleTreeRootDBModel = require('../transactions-merkle-tree-root-db-model')

class TransactionsMerkleTreeDBSchemaBuild extends MerkleTreeDBSchemaBuild {

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
                    schemaBuiltClass: TransactionsMerkleTreeRootDBSchemaBuilt,
                    modelClass: TransactionsMerkleTreeRootDBModel,
                },


            },

        }, schema, false) );
    }

}

module.exports = {
    TransactionsMerkleTreeDBSchemaBuild,
    TransactionsMerkleTreeDBSchemaBuilt: new TransactionsMerkleTreeDBSchemaBuild(),
}