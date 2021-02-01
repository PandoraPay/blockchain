const {DBSchemaBuild} = require('kernel').db;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;

class BlockPoSDBSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                stakeForgerPublicKey: {
                    type: "buffer",
                    fixedBytes: 33,

                    preprocessor(publicKey) {
                        delete this._stakeForgerPublicKeyHash;
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
                    fixedBytes: 20,

                    removeLeadingZeros: true,

                    preprocessor(stakeDelegateRewardPublicKeyHash) {
                        delete this._stakeDelegateRewardAddress;
                        return stakeDelegateRewardPublicKeyHash;
                    },

                    position: 103
                },

                /**
                 * Forger signature
                 */
                stakeForgerSignature: {
                    type: "buffer",
                    fixedBytes: 65,

                    position: 104,
                },


            },

            options: {
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,
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
    BlockPoSDBSchemaBuild,
    BlockPoSDBSchemaBuilt: new BlockPoSDBSchemaBuild()
}