const kernel = require('kernel');
const cryptography = require('cryptography');
const networking = require('networking');

const App = require('./src/app');
const Block = require('./src/block/block');
const BlockVersionEnum = require('./src/block/block-version-enum');
const TransactionsMerkleTree = require('./src/block/transactions/merkle-tree/transactions-merkle-tree');
const TransactionsMerkleTreeNode = require('./src/block/transactions/merkle-tree/transactions-merkle-tree-node');
const TransactionsMerkleTreeRoot = require('./src/block/transactions/merkle-tree/transactions-merkle-tree-root');
const AccountHashVirtualMap = require("./src/chain/maps/account-hash/account-hash-virtual-map");
const AccountHashMapElement = require("./src/chain/maps/account-hash/account-hash-map-element");
const AccountHashMapData = require("./src/chain/maps/account-hash/data/account-hash-map-data");
const AccountHashMapDataDelegate = require ("./src/chain/maps/account-hash/data/account-hash-map-data-delegate");
const AccountHashMapDataBalance = require("./src/chain/maps/account-hash/data/account-hash-map-data-balance");
const TokenHashVirtualMap = require("./src/chain/maps/tokens/tokens-hash/token-hash-virtual-map");
const TokenHashMapElement = require("./src/chain/maps/tokens/tokens-hash/token-hash-map-element");
const TokenHashMapData = require("./src/chain/maps/tokens/tokens-hash/data/token-hash-map-data");

const BlockchainSimpleTransaction = require("./src/transactions/simple-transaction/blockchain-simple-transaction");
const BlockchainDelegateStakeSimpleTransaction = require("./src/transactions/simple-transaction/delegate-stake-simple-transaction/blockchain-delegate-stake-simple-transaction");
const BlockchainTokenCreateSimpleTransaction = require("./src/transactions/tokens/token-create/blockchain-token-create-simple-transaction");
const BlockchainUpdateSupplySimpleTransaction = require("./src/transactions/tokens/token-update-supply/blockchain-token-update-supply-simple-transaction");
const Genesis = require('./src/block/genesis/genesis');
const MainChain = require('./src/chain/main-chain/main-chain');
const MainChainData = require('./src/chain/main-chain/main-chain-data');
const BaseChain = require('./src/chain/base/base-chain');
const BaseChainData = require('./src/chain/base/base-chain-data');
const SubChain = require('./src/chain/sub-chain/sub-chain');
const TestsFiles = require("./tests/tests/tests-index");
const MemPool = require("./src/mem-pool/mem-pool");

const Wallet = require("./src/wallet/wallet");
const WalletAddress = require("./src/wallet/addresses/wallet-address");
const WalletAddressTypeEnum = require("./src/wallet/addresses/data/wallet-address-type-enum");
const WalletAddressTransparentKeys = require("./src/wallet/addresses/data/wallet-address-transparent-keys");

const library = {

    ...kernel,
    ...cryptography,
    ...networking,

    app: new App({}),

    blockchain:{

        block: {
            Block,
            Genesis,
            BlockVersionEnum,
            merkleTree:{
                TransactionsMerkleTree,
                TransactionsMerkleTreeNode,
                TransactionsMerkleTreeRoot,
            },
        },

        mempool:{
            MemPool,
        },

        chain:{
            MainChain,
            BaseChain,
            SubChain,
            data:{
                MainChainData,
                BaseChainData,
            },

            account:{
                AccountHashVirtualMap,
                AccountHashMapElement,
                AccountHashMapData,
                AccountHashMapDataBalance,
                AccountHashMapDataDelegate,
            },

            token: {
                TokenHashVirtualMap,
                TokenHashMapElement,
                TokenHashMapData,
            },

        },

        transactions:{
            BlockchainSimpleTransaction,
            BlockchainDelegateStakeSimpleTransaction,
            BlockchainTokenCreateSimpleTransaction,
            BlockchainUpdateSupplySimpleTransaction,
        },

        wallet:{
            Wallet,
            WalletAddress,
            WalletAddressTransparentKeys,
            WalletAddressTypeEnum,
        },

    },

    utils: {
        ...kernel.utils,
        ...cryptography.utils,
        ...networking.utils,
        App: App,
    },

    tests: {
        ...kernel.tests,
        ...cryptography.tests,
        ...networking.tests,
        TestsFiles,
    }

};



if (typeof window !== "undefined") {
    window.library = library;
    window.PandoraPay = window.app = library.app;
    window.blockchain = library;
}

if (typeof global !== "undefined"){
    global.library = library;
    global.PandoraPay = global.app = library.app;
    global.blockchain = library;
}

module.exports = library;