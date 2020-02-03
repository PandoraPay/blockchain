const Kernel = global.kernel;
const Network = global.networking;
const Crytopgrahy = global.cryptography;
const {NetworkTypeEnum} = global.kernel.enums;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

import Argv from "bin/argv/argv"
import MainChain from "src/chain/main-chain/main-chain";
import Wallet from "src/wallet/wallet"
import Forging from "src/forging/forging"

import Genesis from "src/block/genesis/genesis"

import AccountCommonSocketRouterPlugin from "src/sockets/protocol/account-common-socket-router-plugin"
import BlockchainCommonSocketRouterPlugin from "src/sockets/protocol/blockchain-common-socket-router-plugin"
import TransactionsCommonSocketRouterPlugin from "src/sockets/protocol/transactions-common-socket-router-plugin"
import WalletCommonSocketRouterPlugin from "src/sockets/protocol/wallet-common-socket-router-plugin"
import ForgingCommonSocketRouterPlugin from "src/sockets/protocol/forging-common-socket-router-plugin"
import BlockchainProtocolCommonSocketRouterPlugin from "src/sockets/protocol/blockchain-protocol-common-socket-router-plugin"
import MemPoolCommonSocketRouterPlugin from "src/sockets/protocol/mem-pool-common-socket-router-plugin"
import ExchangeCommonSocketRouterPlugin from "src/sockets/protocol/exchange-common-socket-router-plugin"
import MemPool from "src/mem-pool/mem-pool"
import Exchange from "src/exchange/exchange"

import Testnet from "./testnet/testnet"

import Tests from 'tests/tests/tests-index';

export default class App extends Kernel.utils.App {

    constructor(args){
        super(args);
    }

    async createMainChain(scope = this._scope, merge = {} ){

        //stop the forging on the previous
        if (this._scope.forging) await this._scope.forging.stop();

        const mainChain = new this._scope.MainChain(  Helper.merge( scope, merge, true )  );

        this.setScope( { _scope: scope }, "mainChain", mainChain);

        await this._scope.testnet.createTestNet();

        if ( await scope.mainChain.initializeChain()  === false)
            throw new Exception(this, "MainChain couldn't be initialized");

        if ( await this._scope.memPool.initializeMemPool() === false)
            throw new Exception(this, "MemPool couldn't be initialized");

        if ( await this._scope.exchange.initializeExchange() === false)
            throw new Exception(this, "Exchange couldn't be initialized");

        if ( await this._scope.forging.initializeForging() === false)
            throw new Exception(this, "Forging couldn't be initialized");

        await this.events.emit("start/chain-created", scope);

        return mainChain;


    }

    setAdditionalEvents(){

        Crytopgrahy.app.setAdditionalEvents.call(this);
        Network.app.setAdditionalEvents.call(this);

        this.events.on("start/argv-set", () =>{

            if ( !this._scope.MainChain ) this._scope.MainChain = MainChain;
            if ( !this._scope.Wallet ) this._scope.Wallet = Wallet;
            if ( !this._scope.Forging ) this._scope.Forging = Forging;
            if ( !this._scope.Genesis ) this._scope.Genesis = Genesis;
            if ( !this._scope.MemPool) this._scope.MemPool = MemPool;
            if ( !this._scope.Testnet) this._scope.Testnet = Testnet;
            if ( !this._scope.Exchange) this._scope.Exchange = Exchange;

            this._scope.argv = Argv(this._scope.argv);

            if ( !this._scope.blockchain) this._scope.blockchain = {};

            if (!this._scope.testnet) this._scope.testnet = new this._scope.Testnet(this._scope);

        });

        this.events.on("start/tests-args-middleware", ()=>{

            this._scope.argv = Tests.argvTests( this._scope.argv );
            this._scope.tests.unshift( Tests.tests );


        });


        this.events.on("start/args-processed", async ()=>{

            let genesisSettings;

            if (!this._scope.genesis){

                switch (this._scope.argv.settings.networkType){

                    case NetworkTypeEnum.NETWORK_MAIN_NET:
                        this._scope.logger.log(this, "NETWORK MAIN NET");
                        genesisSettings = this._scope.argv.blockchain.genesis;
                        break;

                    case NetworkTypeEnum.NETWORK_TEST_NET:
                        this._scope.logger.log(this, "NETWORK TEST NET");
                        genesisSettings = this._scope.argv.blockchain.genesisTestNet;
                        genesisSettings.timestamp = Math.floor( new Date().getTime() / 1000 );
                        break;

                    default:
                        throw new Exception(this, "invalid network type", this._scope.argv.settings.networkType );

                }

                /**
                 * Genesis is a block and it will use genesisSettings
                 */
                this._scope.genesisSettings = genesisSettings;
                this._scope.genesis = { settings: genesisSettings };
                this._scope.genesis = new this._scope.Genesis( this._scope, undefined, undefined, undefined, undefined, genesisSettings );

            }


        });

        this.events.on("start/databases-connected", async ()=>{

            if (!this._scope.memPool) this._scope.memPool = new this._scope.MemPool(this._scope,);
            await this._scope.memPool.reload();

            if (!this._scope.exchange) this._scope.exchange = new this._scope.Exchange(this._scope,);
            await this._scope.exchange.reload();

            if (!this._scope.wallet){

                this._scope.wallet = new this._scope.Wallet({
                    ...this._scope,
                    db: this._scope.dbPrivate,
                }, undefined, undefined, undefined, { emptyObject: true } );

                try{
                    await this._scope.wallet.loadWallet();

                    if (this._scope.argv.wallet.printWallet)
                        this._scope.wallet.manager.printWallet();

                    await this._scope.events.emit("wallet/loaded", this._scope.wallet);
                }catch(err){
                    this._scope.logger.error(this, "Error Loading Wallet", err );
                    await this._scope.events.emit("wallet/loaded-error", err );
                }

            }

            this._scope.forging = new this._scope.Forging({
                ...this._scope,
            });


        });

        this.events.on("master-cluster/initialized", async (masterCluster) => {

            if (masterCluster) {
                const commonSocketRouterPlugins = [];

                const checkPlugin = async (plugins, pluginClass) => {

                    for (let i = 0; i < plugins.length; i++)
                        if (plugins[i] instanceof pluginClass) {
                            await plugins[i].stop();
                            plugins[i]._scope = masterCluster._scope;
                            plugins[i].clear();
                            return;
                        }

                    plugins.push(new pluginClass(masterCluster._scope));
                };

                await Promise.all([
                    checkPlugin(commonSocketRouterPlugins, AccountCommonSocketRouterPlugin),
                    checkPlugin(commonSocketRouterPlugins, BlockchainCommonSocketRouterPlugin),
                    checkPlugin(commonSocketRouterPlugins, BlockchainProtocolCommonSocketRouterPlugin),
                    checkPlugin(commonSocketRouterPlugins, TransactionsCommonSocketRouterPlugin),
                    checkPlugin(commonSocketRouterPlugins, WalletCommonSocketRouterPlugin),
                    checkPlugin(commonSocketRouterPlugins, ForgingCommonSocketRouterPlugin),
                    checkPlugin(commonSocketRouterPlugins, MemPoolCommonSocketRouterPlugin),
                    checkPlugin(commonSocketRouterPlugins, ExchangeCommonSocketRouterPlugin),
                ]);

                //setting the clusters for clients and server
                this.setScope({_scope: masterCluster._scope}, "commonSocketRouterPlugins", commonSocketRouterPlugins);

            }

        });


        this.events.on("master-cluster/started", async (masterCluster) => {

            await this.createMainChain(  {
                ...this._scope,
                masterCluster: this._scope.masterCluster,
            },  );

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
    get forging(){ return this._scope.forging }
    get mainChain(){ return this._scope.mainChain }
    get genesis(){ return this._scope.genesis }
    get exchange(){ return this._scope.exchange }

}