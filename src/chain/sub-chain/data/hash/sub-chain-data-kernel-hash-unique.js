const {DBSchemaBufferUnique} = global.kernel.marshal.db.samples;
const {Helper, Exception} = global.kernel.helpers;

export default class SubChainDataKernelHashUnique extends DBSchemaBufferUnique {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

                fields: {

                    table: {
                        default: "kernel",
                        fixedBytes: 6,
                    },

                },

            },
            schema, false),  data, type, creationOptions);

    }

}
