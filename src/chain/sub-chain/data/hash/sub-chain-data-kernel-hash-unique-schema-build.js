const {BufferUniqueSchemaBuild} = require('kernel').schemas.BufferUniqueSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class SubChainDataKernelHashUniqueSchemaBuild extends BufferUniqueSchemaBuild {

    constructor( schema){

        super( Helper.merge( {

                fields: {

                    table: {
                        default: "kernel",
                        fixedBytes: 6,
                    },

                },

            },
            schema, true) );

    }

}


module.exports = {
    SubChainDataKernelHashUniqueSchemaBuild,
    SubChainDataKernelHashUniqueSchemaBuilt: new SubChainDataKernelHashUniqueSchemaBuild()
}