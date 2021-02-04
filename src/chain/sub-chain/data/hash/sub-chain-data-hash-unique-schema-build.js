const {BufferUniqueSchemaBuild} = require('kernel').schemas.BufferUniqueSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class SubChainDataHashUniqueSchemaBuild extends BufferUniqueSchemaBuild {

    constructor(schema ){

        super(Helper.merge( {

                fields: {

                    table: {
                        default: "hash",
                        fixedBytes: 4,
                    },

                },

            },
            schema, true) );

    }

}

module.exports = {
    SubChainDataHashUniqueSchemaBuild,
    SubChainDataHashUniqueSchemaBuilt: new SubChainDataHashUniqueSchemaBuild()
}