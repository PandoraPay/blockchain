const {HashMapElementSchemaBuild} = PandoraLibrary.dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = PandoraLibrary.helpers;

class TokenTickerMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "tokenTickerMap",
                    minSize: 14,
                    maxSize: 14,
                },

                id:{
                    minSize: 2,
                    maxSize: 6,
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
                    type: "buffer",
                    minSize: 20,
                    maxSize: 20,
                    position: 10001,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    TokenTickerMapElementSchemaBuild,
    TokenTickerMapElementSchemaBuilt: new TokenTickerMapElementSchemaBuild()
}