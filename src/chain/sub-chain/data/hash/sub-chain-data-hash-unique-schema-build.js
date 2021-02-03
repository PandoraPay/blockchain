const {BufferUniqueSchemaBuild} = require('kernel').schemas.BufferUniqueSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class SubChainDataHashUniqueSchemaBuild extends BufferUniqueSchemaBuild {

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
    SubChainDataHashUniqueSchemaBuild,
    SubChainDataHashUniqueSchemaBuilt: new SubChainDataHashUniqueSchemaBuild()
}