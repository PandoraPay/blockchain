const kernel = require('kernel');
const cryptography = require('cryptography');
const networking = require('networking');

const App = require('./src/app');
const BlockModel = require('./src/block/block-model');
const BlockVersionEnum = require('./src/block/block-version-enum');
const TxMerkleTreeModel = require('./src/block/transactions/merkle-tree/tx-merkle-tree-model');
const TxMerkleTreeNodeModel = require('./src/block/transactions/merkle-tree/tx-merkle-tree-node-model');
const TxMerkleTreeRootModel = require('./src/block/transactions/merkle-tree/tx-merkle-tree-root-model');
const AccountHashVirtualMapModel = require("./src/chain/maps/account-hash/account-hash-virtual-map-model");
const AccountHashMapElementSchemaBuild = require("./src/chain/maps/account-hash/element/account-hash-map-element-schema-build");
const AccountDataDelegateSchemaBuild = require("./src/chain/maps/account-hash/element/data/account-data-delegate-schema-build");
const AccountDataBalanceSchemaBuild = require("./src/chain/maps/account-hash/element/data/account-data-balance-schema-build");

const TokenHashVirtualMapModel = require("./src/chain/maps/tokens/tokens-hash/token-hash-virtual-map-model");
const TokenHashMapElementSchemaBuild = require("./src/chain/maps/tokens/tokens-hash/token-hash-map-element-schema-build");
const TokenDataSchemaBuild = require("./src/chain/maps/tokens/tokens-hash/data/token-data-schema-build");
const TokenDataModel = require("./src/chain/maps/tokens/tokens-hash/data/token-data-model");

const ChainSimpleTxModel = require("./src/transactions/simple-transaction/chain-simple-tx-model");
const ChainDelegateStakeSimpleTxModel = require("./src/transactions/simple-transaction/delegate-stake-simple-tx/chain-delegate-stake-simple-tx-model");
const ChainTokenCreateSimpleTxModel = require("./src/transactions/tokens/token-create/chain-token-create-simple-tx-model");
const ChainUpdateSupplySimpleTxModel = require("./src/transactions/tokens/token-update-supply/chain-token-update-supply-simple-tx-model");
const GenesisModel = require('./src/block/genesis/genesis-model');
const MainChain = require('./src/chain/main-chain/main-chain');
const MainChainDataModel = require('./src/chain/main-chain/data/main-chain-data-model');
const BaseChain = require('./src/chain/base/base-chain');
const BaseChainDataModel = require('./src/chain/base/base-chain-data-model');
const SubChain = require('./src/chain/sub-chain/sub-chain');
const TestsFiles = require("./tests/tests/tests-index");
const MemPool = require("./src/mem-pool/mem-pool");

const WalletModel = require("./src/wallet/wallet-model");
const WalletAddressModel = require("./src/wallet/addresses/wallet-address-model");
const WalletAddressTypeEnum = require("./src/wallet/addresses/wallet-address-type-enum");
const WalletAddressTransparentKeysModel = require("./src/wallet/addresses/keys/wallet-address-transparent-keys-model");

const {Helper} = PandoraLibrary.helpers;

const library = Helper.merge( PandoraLibrary, {

    app: new App({}),

    blockchain:{

        block: {
            BlockModel,
            GenesisModel,
            BlockVersionEnum,
            merkleTree:{
                TxMerkleTreeModel,
                TxMerkleTreeNodeModel,
                TxMerkleTreeRootModel,
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
                MainChainDataModel,
                BaseChainDataModel,
            },

            account:{
                AccountHashVirtualMapModel,
                AccountHashMapElementSchemaBuild,
                AccountDataBalanceSchemaBuild,
                AccountDataDelegateSchemaBuild,
            },

            token: {
                TokenHashVirtualMapModel,
                TokenHashMapElementSchemaBuild,
                TokenDataSchemaBuild,
                TokenDataModel,
            },

        },

        transactions:{
            ChainSimpleTxModel,
            ChainDelegateStakeSimpleTxModel,
            ChainTokenCreateSimpleTxModel,
            ChainUpdateSupplySimpleTxModel,
        },

        wallet:{
            WalletModel,
            WalletAddressModel,
            WalletAddressTransparentKeysModel,
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

}, true );

if (typeof window !== "undefined") {
    window.PandoraLibrary = library;
    window.PandoraPay = window.app = library.app;
    window.blockchain = library;
}

if (typeof global !== "undefined"){
    global.PandoraLibrary = library;
    global.PandoraPay = global.app = library.app;
    global.blockchain = library;
}

module.exports = library;