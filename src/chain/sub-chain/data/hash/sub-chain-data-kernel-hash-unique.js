const {DBSchemaBufferUnique} = require('kernel').marshal.db.samples;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class SubChainDataKernelHashUnique extends DBSchemaBufferUnique {

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
