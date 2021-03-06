const {HashMapElementSchemaBuild} = PandoraLibrary.dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = PandoraLibrary.helpers;

const AccountDataBalanceModel = require( "./data/account-data-balance-model")
const AccountDataDelegateModel = require( "./data/account-data-delegate-model")

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
                    modelClass: AccountDataBalanceModel,

                    minSize: 0,
                    maxSize: 65535,

                    position: 10002,
                },

                delegateVersion:{
                    type: "number",
                    default: 0,
                    validation(delegateVersion){
                        return (delegateVersion === 0 || delegateVersion === 1);
                    },
                    position: 10003,
                },

                delegate: {
                    type: "object",
                    modelClass: AccountDataDelegateModel,

                    skipHashing(){
                        return this.delegateVersion === 0;
                    },
                    skipMarshal(){
                        return this.delegateVersion === 0;
                    },
                    skipSaving(){
                        return this.delegateVersion === 0;
                    },

                    position: 10004,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    AccountHashMapElementSchemaBuild,
    AccountHashMapElementSchemaBuilt: new AccountHashMapElementSchemaBuild()
}