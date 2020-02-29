const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

export default class DelegatedStake extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

                fields: {

                    table: {
                        default: "delegatedStake",
                        fixedBytes: 14,
                    },

                    //publicKeyHash
                    id:{
                        fixedBytes: 40,
                    },

                    version:{
                        type: "number",

                        default: 0,

                        validation(version){
                            return version === 0;
                        },

                        position: 100,
                    },

                    publicKey:{
                        type: "buffer",
                        fixedBytes: 33,

                        position: 101,
                    },

                    publicKeyHash:{ //same as id
                        type: "buffer",
                        fixedBytes: 20,

                        position: 102,
                    },

                    delegatePublicKey:{
                        type: "buffer",
                        fixedBytes: 33,

                        position: 103,
                    },

                    delegatePrivateKey:{
                        type: "buffer",
                        fixedBytes: 32,

                        position: 104,
                    },

                    amount:{

                        type: "number",
                        position: 104,

                    },


                },

                saving:{
                    indexableById: true,
                    indexable: true,
                },

            },
            schema, false), data, type, creationOptions);

    }

    checkAmount(){

        //let's check balance

        if (this.amount >= this._scope.argv.transactions.coins.convertToUnits(this._scope.argv.transactions.staking.stakingMinimumStake) )
            return true;

        return false;

    }


}