const {BufferUniqueSchemaBuild} = PandoraLibrary.schemas.BufferUniqueSchemaBuild;
const {Helper, Exception} = PandoraLibrary.helpers;

class SubChainDataHashUniqueSchemaBuild extends BufferUniqueSchemaBuild {

    constructor(schema ){

        super(Helper.merge( {

                fields: {

                    table: {
                        default: "hash",
                        minSize: 4,
                        maxSize: 4,
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