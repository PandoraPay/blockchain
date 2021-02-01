const kernel = require('kernel');
const cryptography = require('cryptography');
const networking = require('networking');

const App = require('./src/app');
const BlockDBModel = require('./src/block/block-db-model');
const BlockVersionEnum = require('./src/block/block-version-enum');
const TransactionsMerkleTree = require('./src/block/transactions/merkle-tree/transactions-merkle-tree-db-model');
const TransactionsMerkleTreeNodeDBModel = require('./src/block/transactions/merkle-tree/transactions-merkle-tree-node-db-model');
const TransactionsMerkleTreeRootDBModel = require('./src/block/transactions/merkle-tree/transactions-merkle-tree-root-db-model');
const AccountHashVirtualMapDBModel = require("./src/chain/maps/account-hash/account-hash-virtual-map-db-model");
const AccountHashMapElementDBSchemaBuild = require("./src/chain/maps/account-hash/element/account-hash-map-element-db-schema-build");
const AccountHashMapDataDelegateDBSchemaBuild = require("./src/chain/maps/account-hash/element/data/account-hash-map-data-delegate-schema-build");
const AccountHashMapDataBalanceDBSchemaBuild = require("./src/chain/maps/account-hash/element/data/account-hash-map-data-balance-schema-build");
const TokenHashVirtualMapDBModel = require("./src/chain/maps/tokens/tokens-hash/token-hash-virtual-map-db-model");
const TokenHashMapElementDBSchemaBuild = require("./src/chain/maps/tokens/tokens-hash/token-hash-map-element-db-schema-build");

const BlockchainSimpleTransactionDBModel = require("./src/transactions/simple-transaction/blockchain-simple-transaction-db-model");
const BlockchainDelegateStakeSimpleTransactionDBModel = require("./src/transactions/simple-transaction/delegate-stake-simple-transaction/blockchain-delegate-stake-simple-transaction-db-model");
const BlockchainTokenCreateSimpleTransactionDBModel = require("./src/transactions/tokens/token-create/blockchain-token-create-simple-transaction-db-model");
const BlockchainUpdateSupplySimpleTransactionDBModel = require("./src/transactions/tokens/token-update-supply/blockchain-token-update-supply-simple-transaction-db-model");
const GenesisDBModel = require('./src/block/genesis/genesis-db-model');
const MainChain = require('./src/chain/main-chain/main-chain');
const MainChainDataDBModel = require('./src/chain/main-chain/main-chain-data');
const BaseChain = require('./src/chain/base/base-chain');
const BaseChainDataDBModel = require('./src/chain/base/base-chain-data-db-model');
const SubChain = require('./src/chain/sub-chain/sub-chain');
const TestsFiles = require("./tests/tests/tests-index");
const MemPool = require("./src/mem-pool/mem-pool");

const WalletDBModel = require("./src/wallet/wallet-db-model");
const WalletAddressDBModel = require("./src/wallet/addresses/wallet-address-db-model");
const WalletAddressTypeEnum = require("./src/wallet/addresses/wallet-address-type-enum");
const WalletAddressTransparentKeysDBModel = require("./src/wallet/addresses/keys/wallet-address-transparent-keys-db-model");

const {Helper} = require('kernel').helpers;

let merged = Helper.merge( kernel, {} , true)
merged = Helper.merge(  cryptography, merged , true)
merged = Helper.merge( networking, merged , true)

const library = Helper.merge(merged, {

    app: new App({}),

    blockchain:{

        block: {
            BlockDBModel,
            GenesisDBModel,
            BlockVersionEnum,
            merkleTree:{
                TransactionsMerkleTree,
                TransactionsMerkleTreeNodeDBModel,
                TransactionsMerkleTreeRootDBModel,
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
                MainChainDataDBModel,
                BaseChainDataDBModel,
            },

            account:{
                AccountHashVirtualMapDBModel,
                AccountHashMapElementDBSchemaBuild,
                AccountHashMapDataBalanceDBSchemaBuild,
                AccountHashMapDataDelegateDBSchemaBuild,
            },

            token: {
                TokenHashVirtualMapDBModel,
            },

        },

        transactions:{
            BlockchainSimpleTransactionDBModel,
            BlockchainDelegateStakeSimpleTransactionDBModel,
            BlockchainTokenCreateSimpleTransactionDBModel,
            BlockchainUpdateSupplySimpleTransactionDBModel,
        },

        wallet:{
            WalletDBModel,
            WalletAddressDBModel,
            WalletAddressTransparentKeysDBModel,
            WalletAddressTypeEnum,
        },

    },

    utils: {
        App: App,
    },

    enums: {
        WalletAddressTypeEnum
    },

    tests: {
        TestsFiles,
    }

}, false);


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