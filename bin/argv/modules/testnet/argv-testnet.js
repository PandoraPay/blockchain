export default {

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
                    publicKeyHash: Buffer.from("5d67606c70871010d9a39406cc2ab764a33abd0f", "hex"),
                },

                zsc:{
                    address: "0x5d6c4ebf1b789883b58b0d7a7fe937e275212960",
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