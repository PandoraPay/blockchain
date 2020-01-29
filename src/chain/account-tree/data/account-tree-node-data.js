const {DBSchema} = global.protocol.marshal.db;
const {Helper, Exception} = global.protocol.helpers;
const {CryptoHelper} = global.protocol.helpers.crypto;

import AccountTreeNodeDataBalance from "./account-tree-node-data-balance";

export default class AccountTreeNodeData extends DBSchema{

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
                    classObject: AccountTreeNodeDataBalance,

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
