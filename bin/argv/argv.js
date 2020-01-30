const {Helper} = global.kernel.helpers;

import ArgvBlockchain from "./modules/blockchain/argv-blockchain"
import ArgvBlock from "./modules/block/argv-block"
import ArgvTransactions from "./modules/transactions/argv-transactions"
import ArgvForging from "./modules/forging/argv-forging"
import ArgvWallet from "./modules/wallet/argv-wallet"

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

});


