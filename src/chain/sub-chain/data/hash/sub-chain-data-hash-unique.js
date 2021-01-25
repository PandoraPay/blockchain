const {DBSchemaBufferUnique} = require('kernel').marshal.db.samples;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class SubChainDataHashUnique extends DBSchemaBufferUnique {

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
