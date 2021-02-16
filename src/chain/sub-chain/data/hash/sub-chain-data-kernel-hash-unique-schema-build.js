const {BufferUniqueSchemaBuild} = PandoraLibrary.schemas.BufferUniqueSchemaBuild;
const {Helper, Exception} = PandoraLibrary.helpers;

class SubChainDataKernelHashUniqueSchemaBuild extends BufferUniqueSchemaBuild {

    constructor( schema){

        super( Helper.merge( {

                fields: {

                    table: {
                        default: "kernel",
                        minSize: 6,
                        maxSize: 6,
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