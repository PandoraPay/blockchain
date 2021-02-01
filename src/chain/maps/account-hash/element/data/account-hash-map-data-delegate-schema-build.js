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

                delegatePublicKey: {
                    type: "buffer",
                    fixedBytes: 33,

                    removeLeadingZeros: true,

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