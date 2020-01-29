const {Helper, Exception} = global.protocol.helpers;
const {CryptoHelper} = global.protocol.helpers.crypto;
const {DBSchema} = global.protocol.marshal.db;

export default class MemPoolTxData extends DBSchema {

    constructor(scope, schema = {},  data, type, creationOptions){

        super(scope, Helper.merge( {

            fields: {

                table:{
                    default: "memPoolTx",
                    fixedBytes: 9,
                },

                buffer: {
                    type: "buffer",
                    minSize: 1,
                    maxSize: 65535,
                    position: 100,
                },

                txId: {
                    type: "buffer",
                    fixedBytes: 32,
                    position: 101,
                },

            },

            options:{
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,

                    fct: CryptoHelper.dkeccak256,
                }
            },


        }, schema, false),  data, type, creationOptions);

    }

}
