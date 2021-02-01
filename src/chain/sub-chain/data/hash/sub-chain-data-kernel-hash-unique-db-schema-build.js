const {BufferUniqueDBSchemaBuild} = require('kernel').schemas.BufferUniqueDBSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class SubChainDataKernelHashUniqueDBSchemaBuild extends BufferUniqueDBSchemaBuild {

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
    SubChainDataKernelHashUniqueDBSchemaBuild,
    SubChainDataKernelHashUniqueDBSchemaBuilt: new SubChainDataKernelHashUniqueDBSchemaBuild()
}