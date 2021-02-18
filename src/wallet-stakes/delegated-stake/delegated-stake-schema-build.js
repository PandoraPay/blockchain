const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper} = PandoraLibrary.helpers;

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

                    delegateStakePrivateKey: {
                        type: "buffer",
                        minSize: 32,
                        axSize: 32,

                        position: 103,
                    },

                    delegateStakePublicKey:{
                        type: "buffer",

                        minSize:33,
                        maxSize:33,

                        position: 104,
                    },

                    delegateStakePublicKeyHash: {
                        type: "buffer",

                        minSize: 20,
                        maxSize: 20,

                        position: 105,
                    },

                    amount: {

                        type: "number",
                        position: 106,

                    },

                    errorDelegatePrivateKeyChanged: {
                        type: "boolean",

                        position: 107,
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