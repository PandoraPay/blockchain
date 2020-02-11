if (!global.kernel) require('kernel');
if (!global.cryptography) require('cryptography');
if (!global.networking) require('networking');

const kernel = global.kernel;
const cryptography = global.cryptography;
const networking = global.networking;

const App = require('src/app').default;
const Block = require('src/block/block').default;
const BlockVersionEnum = require('src/block/block-version-enum').default;
const TransactionsMerkleTree = require('src/block/transactions/merkle-tree/transactions-merkle-tree').default;
const TransactionsMerkleTreeNode = require('src/block/transactions/merkle-tree/transactions-merkle-tree-node').default;
const TransactionsMerkleTreeRoot = require('src/block/transactions/merkle-tree/transactions-merkle-tree-root').default;
const AccountHashVirtualMap = require("src/chain/maps/account-hash/account-hash-virtual-map").default;
const AccountHashMapElement = require("src/chain/maps/account-hash/account-hash-map-element").default;
const AccountHashMapData = require("src/chain/maps/account-hash/data/account-hash-map-data").default;
const AccountHashMapDataBalance = require("src/chain/maps/account-hash/data/account-hash-map-data-balance").default;
const BlockchainSimpleTransaction = require("src/transactions/simple-transaction/blockchain-simple-transaction").default;
const Genesis = require('src/block/genesis/genesis').default;
const MainChain = require('src/chain/main-chain/main-chain').default;
const MainChainData = require('src/chain/main-chain/main-chain-data').default;
const BaseChain = require('src/chain/base/base-chain').default;
const BaseChainData = require('src/chain/base/base-chain-data').default;
const SubChain = require('src/chain/sub-chain/sub-chain').default;
const TestsFiles = require("tests/tests/tests-index").default;
const MemPool = require("src/mem-pool/mem-pool").default;
const Exchange = require("src/exchange/exchange").default;
const ExchangeOffer = require("src/exchange/data/exchange-offer").default;
const ExchangeOfferPayment = require("src/exchange/data/exchange-offer-payment").default;
const ExchangeOfferPaymentTypeEnum = require("src/exchange/data/exchange-offer-type-enum").default;
const ExchangeAvailablePayments = require("src/exchange/data/available-payments").default;

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

            accountTree:{
                AccountHashVirtualMap,
                AccountHashMapElement,
                AccountHashMapData,
                AccountHashMapDataBalance,
            }

        },

        transactions:{
            BlockchainSimpleTransaction,
        },


    },

    exchange:{
        Exchange,
        ExchangeOffer,
        ExchangeOfferPayment,
        ExchangeOfferPaymentTypeEnum,
        ExchangeAvailablePayments
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

export default library;