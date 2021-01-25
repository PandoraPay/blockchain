module.exports = {

    activated: false,

    createNewTestNet: false,
    createNewTestNetGenesisAndWallet: false,


    argv: {

        settings: {
            networkType: 1,
        },

        blockchain: {

            genesis: {

                prevHash: Buffer.from("8369351EDB89CF3EB4F2ED6E778DCAC979FD8D19715AC4E5BF7E8F13D9B391F2", "hex"),
                prevKernelHash: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),

                target: Buffer.from("00008FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
                timestamp: Math.floor(new Date("05/13/2019 10:04 pm").getTime() / 1000),

                stakes: {
                    publicKeyHash: Buffer.from("48678502c8bc537fe7dde5f8fbfe476a77282624", "hex"),
                },

                /**
                 * To avoid issues with timestamp in the future
                 */

                getDateNow: function () {
                    return Math.floor(new Date().getTime() / 1000) - this.timestamp;
                },

                _initArgv(parents) {

                }

            },

        },

        transactions: {

            staking: {

                stakingGrindingLockedTransfersBlocks: 10, //making it less for testnet

            }

        },

    },

}