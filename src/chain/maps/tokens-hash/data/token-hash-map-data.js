
const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, StringHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

export default class TokenHashMapData extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge({

            fields: {

                version: {
                    type: "number",
                    fixedBytes: 1,

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 100,
                },

                name:{
                    type: 'string',

                    minSize: 4,
                    maxSize: 10,

                    /**
                     * only lowercase and ascii is allowed.
                     * @param name
                     * @returns {*}
                     */
                    validation(name){
                        return StringHelper.validateLowerString(name);
                    },

                    position: 101,
                },

                description:{
                    type: 'string',

                    minSize: 0,
                    maxSize: 255,

                    position: 102,
                },

                ticker:{
                    type: 'string',

                    minSize: 2,
                    maxSize: 6,

                    /**
                     * only lowercase, ascii is allowed. No space allowed
                     */
                    validation(ticker){
                        return StringHelper.validateLowerString(ticker) && ticker.indexOf(' ') < 0;
                    },

                    position: 103,
                },

                maxSupply:{
                    type: 'number',

                    position: 104,
                },

                decimalSeparator:{
                    type: 'number',

                    minSize: 0,
                    maxSize: 10,

                    position: 105,
                },

                printerPublicKeyHash:{

                    type: "buffer",
                    fixedBytes: 20,

                    position: 106,
                },

                supply:{
                    type: "number",

                    position: 107,
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
