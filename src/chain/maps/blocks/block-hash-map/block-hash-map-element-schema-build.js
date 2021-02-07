const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class BlockHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "blkHashMap",
                    minSize: 10,
                    maxSize: 10,
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

                data: null,

                //height
                height: {
                    type: "number",
                    minSize: 0,
                    maxSize: Number.MAX_SAFE_INTEGER,
                    position: 10001,
                },

            },

        }, schema, true ));

    }

}

module.exports = {
    BlockHashMapElementSchemaBuild,
    BlockHashMapElementSchemaBuilt: new BlockHashMapElementSchemaBuild()
}