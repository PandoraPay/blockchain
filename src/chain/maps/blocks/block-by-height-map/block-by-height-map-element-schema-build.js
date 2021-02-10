const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class BlockByHeightHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "blkByHeightMap",
                    minSize: 14,
                    maxSize: 14,
                },

                //height
                id:{
                    minSize: 1,
                    maxSize: 10,
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

                //hash
                blockHash: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,
                    position: 10001,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    BlockByHeightHashMapElementSchemaBuild,
    BlockByHeightHashMapElementSchemaBuilt: new BlockByHeightHashMapElementSchemaBuild()
}