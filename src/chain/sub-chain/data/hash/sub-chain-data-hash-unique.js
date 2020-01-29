const {DBSchemaBufferUnique} = global.protocol.marshal.db.samples;
const {Helper, Exception} = global.protocol.helpers;

export default class SubChainDataHashUnique extends DBSchemaBufferUnique {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

                fields: {

                    table: {
                        default: "hash",
                        fixedBytes: 4,
                    },

                },

            },
            schema, false),  data, type, creationOptions);

    }

}
