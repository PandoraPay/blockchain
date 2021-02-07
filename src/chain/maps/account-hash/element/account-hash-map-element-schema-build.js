const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const AccountHashMapDataBalanceModel = require( "./data/account-hash-map-data-balance-model")
const AccountHashMapDataDelegateModel = require( "./data/account-hash-map-data-delegate-model")

class AccountHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor( schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "accountMap",
                    minSize: 10,
                    maxSize: 10,
                },

                id: {
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

                nonce: {
                    type: "number",
                    default: 0,

                    position: 10001,
                },

                balances: {
                    type: "array",
                    modelClass: AccountHashMapDataBalanceModel,

                    minSize: 0,
                    maxSize: 65535,

                    position: 10002,
                },

                delegate: {
                    type: "object",
                    modelClass: AccountHashMapDataDelegateModel,

                    position: 10003,
                },

            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: CryptoHelper.dkeccak256

                },
            },

        }, schema, true) );

    }

}

module.exports = {
    AccountHashMapElementSchemaBuild,
    AccountHashMapElementSchemaBuilt: new AccountHashMapElementSchemaBuild()
}