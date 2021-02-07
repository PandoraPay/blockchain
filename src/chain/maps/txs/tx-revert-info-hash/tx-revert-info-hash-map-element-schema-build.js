const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class TxRevertInfoHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "txRevertInfoHashMap",
                    minSize: 19,
                    maxSize: 19,
                },

                //hash
                id:{
                    minSize: 64,
                    maxSize: 64,
                },

                version: {
                    type: "number",
                    default: 0,
                    validation(value){
                        return value === 0;
                    },
                    position: 10000,
                },

                data: null,

                delegateNonce: {
                    type: "number",
                    position: 10001,
                },

                delegatePublicKeyHash: {
                    type: "buffer",
                    minSize: 20,
                    maxSize: 20,
                    specifyLength: true,

                    position: 10002,
                },

                delegateFee: {
                    type: "number",
                    validation(delegateFee){
                        return delegateFee <= this._scope.argv.transactions.staking.delegateStakingFeePercentage;
                    },
                    position: 10003,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    TxRevertInfoHashMapElementSchemaBuild,
    TxRevertInfoHashMapElementSchemaBuilt: new TxRevertInfoHashMapElementSchemaBuild()
}