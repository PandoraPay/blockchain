const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper, EnumHelper, Exception} = PandoraLibrary.helpers;

class BlockPoSSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                stakeForgerPublicKeyHash: {
                    type: "buffer",
                    maxSize: 20,
                    minSize: 20,

                    preprocessor(publicKey) {
                        delete this._stakeForgerAddress;
                        return publicKey;
                    },

                    position: 101,
                },

                stakingAmount: {
                    type: "number",

                    position: 102,
                },

                /**
                 * Public Key Hash (address) where the reward will go
                 */
                stakeDelegateRewardPublicKeyHash: {
                    type: "buffer",

                    maxSize: 20,
                    minSize: 0,
                    specifyLength: true,

                    preprocessor(stakeDelegateRewardPublicKeyHash) {
                        delete this._stakeDelegateRewardAddress;
                        return stakeDelegateRewardPublicKeyHash;
                    },

                    validation(value){
                        return value.length === 0 || value.length === 20;
                    },

                    position: 103
                },

                /**
                 * Forger signature
                 */
                stakeForgerSignature: {
                    type: "buffer",
                    maxSize: 65,
                    minSize: 65,

                    position: 104,
                },


            },

            options: {
                hashing: {
                    fct: b => b,
                }
            },

            saving: {
                storeDataNotId: true,
            },

        }, schema, true))

    }

}

module.exports = {
    BlockPoSSchemaBuild,
    BlockPoSSchemaBuilt: new BlockPoSSchemaBuild()
}