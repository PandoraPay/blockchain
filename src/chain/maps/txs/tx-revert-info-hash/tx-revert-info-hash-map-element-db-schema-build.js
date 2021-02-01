const {HashMapElementDBSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementDBSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class TxRevertInfoHashMapElementDBSchemaBuild extends HashMapElementDBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "txRevertInfoHashMap",
                    fixedBytes: 19,
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

                //it will store json, it will be easier
                data: {
                    type: "buffer",
                    maxSize: 100000,
                    minSize: 0,

                    position: 10001,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    TxRevertInfoHashMapElementDBSchemaBuild,
    TxRevertInfoHashMapElementDBSchemaBuilt: new TxRevertInfoHashMapElementDBSchemaBuild()
}