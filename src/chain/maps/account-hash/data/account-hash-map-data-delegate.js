const {DBSchema} = require('kernel').marshal.db;
const {Helper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

module.exports = class AccountHashMapDataDelegate extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge({

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
                        return delegateFee <= scope.argv.transactions.staking.delegateStakingFeePercentage;
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

        }, schema, false), data, type, creationOptions);

    }

    isDataEmpty(){

        if (this.delegateNonce === 0 && this.delegatePublicKey.equals( Buffer.alloc(33) ) && this.delegateFee === 0 ) return true;

        return false;
    }

}
