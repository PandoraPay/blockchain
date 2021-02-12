const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {TxTokenCurrencyTypeEnum} = require('cryptography').transactions;

class TokenDataSchemaBuild extends DBSchemaBuild {

    constructor(schema){

        super(Helper.merge({

            fields: {

                version: {
                    type: "number",

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 1000,
                },

                //upgrade different settings
                canUpgrade: {
                    type: "boolean",
                    position: 1001
                },

                //increase supply
                canMint: {
                    type: "boolean",
                    position: 1002
                },

                //decrease supply
                canBurn: {
                    type: "boolean",
                    position: 1003
                },

                //can change the verification public key hash
                canChangeVerificationPublicKeyHash:{
                    type: "boolean",
                    position: 1004
                },

                //can pause (suspend transactions)
                canPause:{
                    type: "boolean",
                    position: 1005
                },

                //freeze supply changes
                canFreeze:{
                    type: "boolean",
                    position: 1006
                },

                name:{
                    type: 'string',

                    minSize: 2,
                    maxSize: 15,

                    // only lowercase ascii and one space between words is allowed.
                    validation(name){
                        return /^([a-zA-Z0-9]+ )+[a-zA-Z0-9]+$|^[a-zA-Z0-9]+$/.exec(name);
                    },

                    position: 1007,
                },

                ticker:{

                    type: 'string',

                    minSize: 2,
                    maxSize: 7,

                    // only lowercase ascii is allowed. No space allowed
                    validation(ticker){
                        return /^[A-Z0-9]+$/.exec(ticker);
                    },

                    position: 1008,
                },

                description:{
                    type: 'string',

                    minSize: 0,
                    maxSize: 512,

                    position: 1009,
                },

                decimalSeparator:{
                    type: 'number',

                    minSize: 0,
                    maxSize: 10,

                    position: 1010,
                },

                maxSupply:{
                    type: 'number',

                    position: 1011,
                },

                verificationPublicKeyHash:{

                    type: "buffer",
                    minSize: 20,
                    maxSize: 20,

                    position: 1012,
                },

                supply:{
                    type: "number",
                    default: 0,
                    validation: function (supply){
                        return supply >= 0 && supply <= this.maxSupply;
                    },
                    position: 1013,
                },

            },

            options: {
                hashing: {
                    fct: b => b,
                },
            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, true ));

    }

}


module.exports = {
    TokenDataSchemaBuild,
    TokenDataSchemaBuilt: new TokenDataSchemaBuild(),
}