const {Helper} = global.kernel.helpers;

import ArgvBlockchain from "./modules/blockchain/argv-blockchain"
import ArgvBlock from "./modules/block/argv-block"
import ArgvTransactions from "./modules/transactions/argv-transactions"
import ArgvForging from "./modules/forging/argv-forging"
import ArgvWallet from "./modules/wallet/argv-wallet"
import ArgvWalletStakes from "./modules/wallet-stakes/argv-wallet-stakes"
import ArgvExchange from "./modules/exchange/argv-exchange"
import ArgvTestnet from "./modules/testnet/argv-testnet"
/**
 *
 * Blockchain
 *
 */

export default (argv) => Helper.merge( argv, {

    blockchain: ArgvBlockchain,
    block: ArgvBlock,
    transactions: ArgvTransactions,
    forging: ArgvForging,
    wallet: ArgvWallet,
    walletStakes: ArgvWalletStakes,
    exchange: ArgvExchange,

    testnet: ArgvTestnet,

});


