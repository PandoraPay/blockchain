module.exports = {

    activated: false,

    createNewTestNet: false,
    createNewTestNetGenesisAndWallet: false,


    argv: {

        settings: {
            networkType: 1,
        },

        crypto:{

            addresses:{

                publicAddress:{

                    networkByte: 128, //testnet addresses
                    networkByteLength: 2, //testnet addresses

                    networkPrefix: "PAND_TESTNET",
                    networkPrefixBuffer: Buffer.from("PAND_TESTNET", 'ascii'),
                    networkPrefixLength: 12,

                }

            },

        },

        blockchain: {

            genesis: {

                prevHash: Buffer.from("8369351EDB89CF3EB4F2ED6E778DCAC979FD8D19715AC4E5BF7E8F13D9B391F2", "hex"),
                prevKernelHash: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),

                target: Buffer.from("00008FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
                timestamp: Math.floor(new Date("05/13/2019 10:04 pm").getTime() / 1000),

                stakes: {
                    publicKeyHash: Buffer.from("45150e7fbec39174cbb9e3d732570ff87b842056", "hex"),
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
                stakingMinimumStakeEffectBlockHeight: 50,

            }

        },

    },

}