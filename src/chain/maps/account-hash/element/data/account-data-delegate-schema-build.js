const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper, Exception} = PandoraLibrary.helpers;

class AccountDataDelegateSchemaBuild extends DBSchemaBuild {

    constructor(schema = { }){

        super(Helper.merge({

            fields: {

                delegateStakeNonce: {
                    type: "number",
                    position: 100,
                },

                delegateStakePublicKey: {
                    type: "buffer",

                    minSize: 0,
                    maxSize: 33,

                    position: 101,
                },

                delegateStakeFee: {
                    type: "number",

                    validation(delegateStakeFee){
                        return delegateStakeFee <= this._scope.argv.transactions.staking.delegateStakingFeePercentage;
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