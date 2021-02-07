const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class TokenHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "tokenMap",
                    minSize: 8,
                    maxSize: 8,
                },

                //hash
                id:{
                    minSize: 40,
                    maxSize: 40,
                },

                data: null,

                version: {
                    type: "number",

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 10000,
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

                    position: 10001,
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

                    position: 10002,
                },

                description:{
                    type: 'string',

                    minSize: 0,
                    maxSize: 512,

                    position: 10003,
                },


                maxSupply:{
                    type: 'number',

                    position: 10004,
                },

                decimalSeparator:{
                    type: 'number',

                    minSize: 0,
                    maxSize: 10,

                    position: 10005,
                },

                verificationPublicKeyHash:{

                    type: "buffer",
                    minSize: 20,
                    maxSize: 20,

                    position: 10006,
                },

                supply:{
                    type: "number",

                    position: 10007,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    TokenHashMapElementSchemaBuild,
    TokenHashMapElementSchemaBuilt: new TokenHashMapElementSchemaBuild()
}