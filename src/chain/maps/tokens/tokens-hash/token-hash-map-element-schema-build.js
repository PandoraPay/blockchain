const {HashMapElementSchemaBuild} = PandoraLibrary.dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = PandoraLibrary.helpers;

const TokenDataModel = require('./data/token-data-model')

class TokenHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "tokenMap",
                    minSize: 8,
                    maxSize: 8,
                },

                //hash
                id:{
                    minSize: 40,
                    maxSize: 40,
                },

                data: {
                    type: "object",
                    modelClass: TokenDataModel,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    TokenHashMapElementSchemaBuild,
    TokenHashMapElementSchemaBuilt: new TokenHashMapElementSchemaBuild()
}