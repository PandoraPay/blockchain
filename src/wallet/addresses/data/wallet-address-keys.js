const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;
const {DBEncryptedSchema} = global.cryptography.marshal.db.samples;

export default class WalletAddressKeys extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "address",
                        fixedBytes: 6,
                    },

                    version: {
                        type: "number",
                        fixedBytes: 1,

                        default: 0,

                        validation(version){
                            return version === 0;
                        },

                        position: 100,

                    },

                    private:{
                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 102,
                    },

                    public:{
                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 103,
                    },



                },

                options: {
                    hashing: {
                        enabled: true,
                        parentHashingPropagation: true,
                        fct: CryptoHelper.dkeccak256,
                    }
                }

            },
            schema, false), data, type, creationOptions);

    }

}