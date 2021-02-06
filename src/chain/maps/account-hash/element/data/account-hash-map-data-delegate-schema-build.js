const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception} = require('kernel').helpers;

class AccountHashMapDataDelegateSchemaBuild extends DBSchemaBuild {

    constructor(schema = { }){

        super(Helper.merge({

            fields: {

                delegateNonce: {
                    type: "number",
                    position: 100,
                },

                delegatePublicKeyHash: {
                    type: "buffer",

                    minSize: 0,
                    maxSize: 20,
                    specifyLength: true,

                    validation(value){
                        return value.length === 0 || value.length === 20;
                    },

                    position: 101,
                },

                delegateFee: {
                    type: "number",

                    validation(delegateFee){
                        return delegateFee <= this._scope.argv.transactions.staking.delegateStakingFeePercentage;
                    },

                    position: 102,
                },


            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: b => b,

                },
            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, true) );

    }

}

module.exports = {
    AccountHashMapDataDelegateSchemaBuild,
    AccountHashMapDataDelegateSchemaBuilt: new AccountHashMapDataDelegateSchemaBuild()
}