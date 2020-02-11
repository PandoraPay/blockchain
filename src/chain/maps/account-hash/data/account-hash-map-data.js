const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

import AccountHashMapDataBalance from "./account-hash-map-data-balance";

export default class AccountHashMapData extends DBSchema{

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

        if (this.balances.length === 0 && this.nonce === 0 ) return true;

        return false;
    }

}
