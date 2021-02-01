const {HashMapElementDBSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementDBSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class TokenNameMapElementDBSchemaBuild extends HashMapElementDBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "tokenNameMap",
                    fixedBytes: 12,
                },

                id:{
                    fixedBytes: null,
                    minSize: 2,
                    maxSize: 15,
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

                hash: {
                    type: "string",
                    fixedBytes: 40,
                    position: 10001,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    TokenNameMapElementDBSchemaBuild,
    TokenNameMapElementDBSchemaBuilt: new TokenNameMapElementDBSchemaBuild()
}