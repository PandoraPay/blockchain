const {NetworkTypeEnum} = PandoraLibrary.enums;
const {Helper, Exception, BufferHelper} = PandoraLibrary.helpers;

const Argv = require( "../bin/argv/argv")
const MainChain = require( "../src/chain/main-chain/main-chain");
const WalletModel = require( "./wallet/wallet-model")
const WalletStakesModel = require( "./wallet-stakes/wallet-stakes-model")
const Forging = require( "../src/forging/forging")

const GenesisModel = require( "./block/genesis/genesis-model")

const AccountCommonSocketRouterPlugin = require( "../src/sockets/protocol/account-common-socket-router-plugin")
const TokenCommonSocketRouterPlugin = require( "../src/sockets/protocol/token-common-socket-router-plugin")
const BlockchainCommonSocketRouterPlugin = require( "../src/sockets/protocol/blockchain-common-socket-router-plugin")
const TransactionsCommonSocketRouterPlugin = require( "../src/sockets/protocol/transactions-common-socket-router-plugin")
const WalletCommonSocketRouterPlugin = require( "../src/sockets/protocol/wallet-common-socket-router-plugin")
const WalletStakesCommonSocketRouterPlugin = require( "../src/sockets/protocol/wallet-stakes-common-socket-router-plugin")
const ForgingCommonSocketRouterPlugin = require( "../src/sockets/protocol/forging-common-socket-router-plugin")
const BlockchainProtocolCommonSocketRouterPlugin = require( "../src/sockets/protocol/blockchain-protocol-common-socket-router-plugin")
const MemPoolCommonSocketRouterPlugin = require( "../src/sockets/protocol/mem-pool-common-socket-router-plugin")
const MemPool = require( "../src/mem-pool/mem-pool")

const Testnet = require( "./testnet/testnet")

const Tests = require( '../tests/tests/tests-index');

module.exports = class App extends PandoraLibrary.utils.App {

    constructor(args){
        super(args);
    }

    async createMainChain(scope = this._scope, merge = {} ){

        //stop the forging on the previous
        if (this._scope.forging) await this._scope.forging.stop();

        const mainChain = new this._scope.MainChain(  Helper.merge( scope, merge, true )  );

        this.setScope( { _scope: scope }, "mainChain", mainChain);

        await this._scope.testnet.createTestNet();

        if ( await scope.mainChain.initializeChain()  !== true)
            throw new Exception(this, "MainChain couldn't be initialized");

        if ( await this._scope.walletStakes.initializeWalletStakes() !== true)
            throw new Exception(this, "WalletStakes couldn't be initialized");

        if ( await this._scope.memPool.initializeMemPool() !== true)
            throw new Exception(this, "MemPool couldn't be initialized");

        if ( await this._scope.forging.initializeForging() !== true)
            throw new Exception(this, "Forging couldn't be initialized");

        if (await this._scope.wallet.initializeWallet() !== true)
            throw new Exception(this, "Wallet couldn't be initialized");

        await this.events.emit("start/chain-created", scope);

        return mainChain;


    }

    setAdditionalEvents(){

        super.setAdditionalEvents()

        this.events.on("start/argv-set", () =>{

            if ( !this._scope.MainChain ) this._scope.MainChain = MainChain;
            if ( !this._scope.WalletModel ) this._scope.WalletModel = WalletModel;
            if ( !this._scope.WalletStakesModel ) this._scope.WalletStakesModel = WalletStakesModel;
            if ( !this._scope.Forging ) this._scope.Forging = Forging;
            if ( !this._scope.GenesisModel ) this._scope.GenesisModel = GenesisModel;
            if ( !this._scope.MemPool) this._scope.MemPool = MemPool;
            if ( !this._scope.Testnet) this._scope.Testnet = Testnet;

            this._scope.argv = Argv(this._scope.argv);

            if ( !this._scope.blockchain) this._scope.blockchain = {};

            if (!this._scope.testnet) this._scope.testnet = new this._scope.Testnet(this._scope);

        });

        this.events.on("start/tests-args-middleware", ()=>{

            this._scope.argv = Tests.argvTests( this._scope.argv );
            this._scope.tests.unshift( Tests.tests );


        });


        this.events.on("start/args-processed", async ()=>{

            if (this._scope.argv.testnet.activated)
                Helper.import( this._scope.argv, this._scope.argv.testnet.argv );

            let genesisSettings;

            if (!this._scope.genesis){

                genesisSettings = Helper.merge( {}, this._scope.argv.blockchain.genesis, true);

                switch (this._scope.argv.settings.networkType){

                    case NetworkTypeEnum.NETWORK_MAIN_NET:
                        this._scope.logger.log(this, "NETWORK MAIN NET");
                        break;

                    case NetworkTypeEnum.NETWORK_TEST_NET:
                        this._scope.logger.log(this, "NETWORK TEST NET");

                        if (this._scope.argv.testnet.createNewTestNet )
                            genesisSettings.timestamp = Math.trunc( new Date().getTime() / 1000 / 60 ) *60;

                        break;

                    default:
                        throw new Exception(this, "invalid network type", this._scope.argv.settings.networkType );

                }

                this._scope.logger.info(this, 'genesisSettings.timestamp', genesisSettings.timestamp);

                /**
                 * Genesis is a block and it will use genesisSettings
                 */
                this._scope.genesisSettings = genesisSettings;
                this._scope.genesis = { settings: genesisSettings };
                this._scope.genesis = new this._scope.GenesisModel( this._scope, undefined, undefined, undefined, undefined, genesisSettings );

            }


        });

        this.events.on("start/databases-connected", async ()=>{

            if (!this._scope.memPool) this._scope.memPool = new this._scope.MemPool(this._scope,);
            await this._scope.memPool.reload();

            if (!this.wallet){

                this._scope.wallet = new this._scope.WalletModel({
                    ...this._scope,
                    db: this._scope.dbPrivate,
                }, undefined, undefined, undefined, { loading: true } );

                try{

                    if ( await this.wallet.loadWallet() !== true) throw new Exception(this, "loadWallet is not true");

                    if (this._scope.argv.wallet.printWallet) this.wallet.manager.printWallet();

                    await this._scope.events.emit("wallet/loaded", this._scope.wallet);
                }catch(err){
                    this._scope.logger.error(this, "Error Loading Wallet", err );
                    await this._scope.events.emit("wallet/loaded-error", err );
                }

            }

            if (!this.walletStakes){

                this._scope.walletStakes = new this._scope.WalletStakesModel({
                    ...this._scope,
                    db: this._scope.dbPrivate,
                });

                try{

                    if (this._scope.argv.walletStakes.deleteWalletStakes)
                        await this.walletStakes.clearWalletStakes(true);

                    if (await this._scope.walletStakes.loadWalletStakes() !== true) throw new Exception(this, "loadWalletStakes is no true");

                    await this._scope.events.emit("wallet-stakes/loaded", this._scope.walletStakes);
                }catch(err){
                    this._scope.logger.error(this, "Error Loading WalletStakes", err );
                    await this._scope.events.emit("wallet-stakes/loaded-error", err );
                }

            }

            this._scope.forging = new this._scope.Forging({
                ...this._scope,
            });


        });

        this.events.on("master-cluster/initialized", async (masterCluster) => {

            if (masterCluster) {

                const commonSocketRouterPlugins = [];
                const commonSocketRouterPluginsMap = {};

                const checkPlugin = async (plugins, pluginsMap, pluginClass, pluginName) => {

                    for (let i = 0; i < plugins.length; i++)
                        if (plugins[i] instanceof pluginClass) {
                            await plugins[i].stop();
                            plugins[i]._scope = masterCluster._scope;
                            plugins[i].clear();
                            return;
                        }

                    const plugin = new pluginClass(masterCluster._scope);
                    plugins.push(plugin);
                    pluginsMap[pluginName] = plugin;
                };

                await Promise.all([
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, AccountCommonSocketRouterPlugin, 'accountCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, TokenCommonSocketRouterPlugin, 'tokenCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, BlockchainCommonSocketRouterPlugin, 'blockchainCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, BlockchainProtocolCommonSocketRouterPlugin, 'blockchainProtocolCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, TransactionsCommonSocketRouterPlugin, 'transactionsCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, WalletCommonSocketRouterPlugin, 'walletCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, WalletStakesCommonSocketRouterPlugin, 'walletStakesCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, ForgingCommonSocketRouterPlugin, 'forgingCommonSocketRouterPlugin'),
                    checkPlugin(commonSocketRouterPlugins, commonSocketRouterPluginsMap, MemPoolCommonSocketRouterPlugin, 'memPoolCommonSocketRouterPlugin'),
                ]);

                //setting the clusters for clients and server
                this.setScope({_scope: masterCluster._scope}, "commonSocketRouterPlugins", commonSocketRouterPlugins);
                this.setScope({_scope: masterCluster._scope}, "commonSocketRouterPluginsMap", commonSocketRouterPluginsMap);

            }

        });


        this.events.on("master-cluster/initialized", async (masterCluster) => {

            await this.createMainChain(  {
                ...this._scope,
                masterCluster: this._scope.masterCluster,
            },  );

        });

        this.events.on("master-cluster/started", async (masterCluster) => {

            if (this._scope.argv.forging.start)
                await this._scope.forging.start();

        });

        this.events.on("master-cluster/closed", async () => {

            await this._scope.forging.stop();

        });

        this.events.on("start/init-processed", async () => {
            
            this._scope.logger.info(`Status`, `Blockchain has been started`);

        });

    }

    get cryptography(){ return this._scope.cryptography }

    get wallet(){ return this._scope.wallet }
    get walletStakes(){ return this._scope.walletStakes }
    get forging(){ return this._scope.forging }
    get mainChain(){ return this._scope.mainChain }
    get genesis(){ return this._scope.genesis }

}