const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class TxRevertInfoHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "txRevertInfoHashMap",
                    minSize: 19,
                    maxSize: 19,
                },

                //hash
                id:{
                    minSize: 64,
                    maxSize: 64,
                },

                version: {
                    type: "number",
                    default: 0,
                    validation(value){
                        return value === 0;
                    },
                    position: 10000,
                },

                data: {
                    type: "string",
                    maxSize: 1000,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    TxRevertInfoHashMapElementSchemaBuild,
    TxRevertInfoHashMapElementSchemaBuilt: new TxRevertInfoHashMapElementSchemaBuild()
}