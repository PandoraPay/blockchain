const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class BlockHeightHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "blkHeightMap",
                    fixedBytes: 6,
                },

                //height
                id:{
                    minSize: 1,
                    maxSize: 10,
                    fixedBytes: undefined,
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
                hash: {

                    type: "buffer",
                    fixedBytes: 32,
                    minSize: 32,
                    maxSize: 32,
                    position: 10001,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    BlockHeightHashMapElementSchemaBuild,
    BlockHeightHashMapElementSchemaBuilt: new BlockHeightHashMapElementSchemaBuild()
}