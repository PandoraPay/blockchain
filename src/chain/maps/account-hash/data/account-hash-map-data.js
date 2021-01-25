
const {DBSchema} = require('kernel').marshal.db;
const {Helper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const AccountHashMapDataBalance = require( "./account-hash-map-data-balance");
const AccountHashMapDataDelegate = require("./account-hash-map-data-delegate");

module.exports = class AccountHashMapData extends DBSchema{

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

                nonce: {
                    type: "number",
                    default: 0,

                    position: 101,
                },

                balances: {
                    type: "array",
                    classObject: AccountHashMapDataBalance,

                    minSize: 0,
                    maxSize: 65535,

                    position: 102,
                },

                delegate: {
                    type: "object",
                    classObject: AccountHashMapDataDelegate,

                    position: 103,
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

    isDataEmpty(){

        if (this.balances.length === 0 && this.nonce === 0 && this.delegate.isDataEmpty() ) return true;

        return false;
    }

}
