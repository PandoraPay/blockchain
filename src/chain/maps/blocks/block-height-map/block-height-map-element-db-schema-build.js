const {HashMapElementDBSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementDBSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class BlockHeightHashMapElementDBSchemaBuild extends HashMapElementDBSchemaBuild {

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
                    minSize: undefined,
                    maxSize: undefined,
                    position: 10001,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    BlockHeightHashMapElementDBSchemaBuild,
    BlockHeightHashMapElementDBSchemaBuilt: new BlockHeightHashMapElementDBSchemaBuild()
}