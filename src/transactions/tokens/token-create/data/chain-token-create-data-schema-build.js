const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception} = require('kernel').helpers;

class ChainTokenCreateDataSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                dataVersion:{
                    type: "number",

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 1000,
                },

                tokenPublicKeyHash:{
                    type: "buffer",
                    fixedBytes: 20,
                    minSize: 20,
                    maxSize: 20,

                    position: 1001,
                },

                version: {
                    type: "number",

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 1002,
                },

                name:{
                    type: 'string',

                    minSize: 2,
                    maxSize: 15,

                    /**
                     * only lowercase ascii and one space between words is allowed.
                     */
                    validation(name){
                        return /^([a-zA-Z0-9]+ )+[a-zA-Z0-9]+$|^[a-zA-Z0-9]+$/.exec(name);
                    },

                    position: 1003,
                },

                ticker:{

                    type: 'string',

                    minSize: 2,
                    maxSize: 7,

                    /**
                     * only lowercase ascii is allowed. No space allowed
                     */
                    validation(ticker){
                        return /^[A-Z0-9]+$/.exec(ticker) && ticker !== this._scope.argv.transactions.coinbase.tokenTicker;
                    },

                    position: 1004,
                },

                description:{
                    type: 'string',

                    minSize: 0,
                    maxSize: 512,

                    position: 1005,
                },

                maxSupply:{
                    type: 'number',

                    position: 1006,
                },

                decimalSeparator:{
                    type: 'number',

                    minSize: 0,
                    maxSize: 10,

                    position: 1007,
                },

                verificationPublicKey:{

                    type: "buffer",
                    fixedBytes: 33,
                    minSize: 33,
                    maxSize: 33,

                    position: 1008,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    ChainTokenCreateDataSchemaBuild,
    ChainTokenCreateDataSchemaBuilt: new ChainTokenCreateDataSchemaBuild()
}