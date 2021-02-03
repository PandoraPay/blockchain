const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class TxRevertInfoHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

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
    TxRevertInfoHashMapElementSchemaBuild,
    TxRevertInfoHashMapElementSchemaBuilt: new TxRevertInfoHashMapElementSchemaBuild()
}