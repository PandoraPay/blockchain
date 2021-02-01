const {HashMapElementDBSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementDBSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class TxInfoHashMapElementDBSchemaBuild extends HashMapElementDBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "txInfoHashMap",
                    fixedBytes: 13,
                },

                //hash
                id:{
                    fixedBytes: 64,
                },

                version: {
                    type: "number",
                    default: 0,
                    validation(value){
                        return value === 0;
                    },
                    position: 10000,
                },

                blockTimestamp:{
                    type: "number",
                    position: 10001,
                },

                blockHeight: {
                    type: "number",
                    position: 10002,
                },

                //height in binary merkle tree
                merkleHeight:{
                    type: "number",
                    position: 10003,
                },

                //leaf index
                merkleLeafHeight:{
                    type: "number",
                    position: 10004,
                },

            },

        }, schema, true ) );

    }

}

module.exports = {
    TxInfoHashMapElementDBSchemaBuild,
    TxInfoHashMapElementDBSchemaBuilt: new TxInfoHashMapElementDBSchemaBuild()
}