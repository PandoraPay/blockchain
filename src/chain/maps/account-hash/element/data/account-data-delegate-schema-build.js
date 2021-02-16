const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper, Exception} = PandoraLibrary.helpers;

class AccountDataDelegateSchemaBuild extends DBSchemaBuild {

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
    AccountDataDelegateSchemaBuild,
    AccountDataDelegateSchemaBuilt: new AccountDataDelegateSchemaBuild()
}