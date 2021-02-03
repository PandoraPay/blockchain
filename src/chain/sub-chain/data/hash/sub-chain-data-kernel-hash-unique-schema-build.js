const {BufferUniqueSchemaBuild} = require('kernel').schemas.BufferUniqueSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class SubChainDataKernelHashUniqueSchemaBuild extends BufferUniqueSchemaBuild {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

                fields: {

                    table: {
                        default: "kernel",
                        fixedBytes: 6,
                    },

                },

            },
            schema, true),  data, type, creationOptions);

    }

}


module.exports = {
    SubChainDataKernelHashUniqueSchemaBuild,
    SubChainDataKernelHashUniqueSchemaBuilt: new SubChainDataKernelHashUniqueSchemaBuild()
}