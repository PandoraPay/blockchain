const {BufferUniqueDBSchemaBuild} = require('kernel').schemas.BufferUniqueDBSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class SubChainDataHashUniqueDBSchemaBuild extends BufferUniqueDBSchemaBuild {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

                fields: {

                    table: {
                        default: "hash",
                        fixedBytes: 4,
                    },

                },

            },
            schema, true),  data, type, creationOptions);

    }

}

module.exports = {
    SubChainDataHashUniqueDBSchemaBuild,
    SubChainDataHashUniqueDBSchemaBuilt: new SubChainDataHashUniqueDBSchemaBuild()
}