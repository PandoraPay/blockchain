
const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

export default class TokenHashMapData extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge({

            fields: {

                version: {
                    type: "number",
                    fixedBytes: 1,

                    default: 0,
                    validate(version){
                        return version === 0;
                    },
                    position: 100,
                },


            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: CryptoHelper.sha256

                },
            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, false), data, type, creationOptions);

    }

}
