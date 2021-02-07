const {DBSchemaBuild} = require('kernel').db;
const {Helper} = require('kernel').helpers;

class DelegatedStakeSchemaBuild extends DBSchemaBuild{

    constructor(schema) {

        super(Helper.merge({

                fields: {

                    table: {
                        default: "delegatedStake",
                        minSize: 14,
                        maxSize: 14,
                    },

                    //publicKeyHash
                    id: {
                        minSize: 40,
                        maxSize: 40,
                    },

                    version: {
                        type: "number",

                        default: 0,

                        validation(version) {
                            return version === 0;
                        },

                        position: 100,
                    },

                    publicKey: {
                        type: "buffer",
                        minSize: 33,
                        maxSize: 33,

                        position: 101,
                    },

                    publicKeyHash: { //same as id
                        type: "buffer",
                        minSize: 20,
                        maxSize: 20,

                        position: 102,
                    },

                    delegatePublicKeyHash: {
                        type: "buffer",

                        minSize: 0,
                        maxSize: 20,
                        specifyLength: true,

                        position: 103,
                    },

                    delegatePrivateKey: {
                        type: "buffer",
                        minSize: 32,
                        axSize: 32,

                        position: 104,
                    },

                    amount: {

                        type: "number",
                        position: 105,

                    },

                    errorDelegatePrivateKeyChanged: {
                        type: "boolean",

                        position: 106,
                    }

                },

                saving: {
                    indexableById: true,
                    indexable: true,
                },

            },
            schema, true ));

    }

}

module.exports = {
    DelegatedStakeSchemaBuild,
    DelegatedStakeSchemaBuilt: new DelegatedStakeSchemaBuild(),
}