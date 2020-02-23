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

                    publicKeyHash:{ //same as id
                        type: "buffer",
                        fixedBytes: 20,

                        position: 101,
                    },

                    delegatePublicKey:{
                        type: "buffer",
                        fixedBytes: 33,

                        position: 102,
                    },

                    delegatePrivateKey:{
                        type: "buffer",
                        fixedBytes: 32,

                        position: 103,
                    },

                    amount:{

                        type: "number",

                        sorts :{

                            amountsort:{

                                score(){
                                    return this.amount;
                                },

                            }
                        },

                        position: 104,
                    },

                    date: {
                        type: "number",

                        position: 105,
                    },

                },

                saving:{
                    indexableById: true,
                    indexable: true,
                },

            },
            schema, false), data, type, creationOptions);

    }



}