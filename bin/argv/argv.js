const {Helper} = PandoraLibrary.helpers;

const ArgvBlockchain = require("./modules/blockchain/argv-blockchain")
const ArgvBlock = require("./modules/block/argv-block")
const ArgvTransactions = require( "./modules/transactions/argv-transactions")
const ArgvForging = require( "./modules/forging/argv-forging")
const ArgvWallet = require("./modules/wallet/argv-wallet")
const ArgvWalletStakes = require( "./modules/wallet-stakes/argv-wallet-stakes")
const ArgvTestnet = require("./modules/testnet/argv-testnet")
const ArgvMemPool = require( "./modules/mem-pool/argv-mem-pool")

/**
 *
 * Blockchain
 *
 */

module.exports = (argv) => Helper.merge( argv, {

    blockchain: ArgvBlockchain,
    block: ArgvBlock,
    transactions: ArgvTransactions,
    forging: ArgvForging,
    wallet: ArgvWallet,
    walletStakes: ArgvWalletStakes,

    memPool: ArgvMemPool,
    testnet: ArgvTestnet,

});


