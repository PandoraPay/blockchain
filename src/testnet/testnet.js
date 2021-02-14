const {Exception, Helper} = require('kernel').helpers;

module.exports = class TestNet{

    constructor(scope){

        this._scope = scope;

        this._testnetWallets = [];
        this._testnetWalletsSent = false;

        this._prevBlockEnd = -1;
    }

    async createTestNet(){

        if (BROWSER) return; //no support for browser right now

        if (this._scope.argv.testnet.createNewTestNetGenesisAndWallet)
            await this.createTestNetGenesisAndWallet();


        if (this._scope.argv.testnet.createNewTestNet)
            this._propagateTestNetWallet();


    }

    _propagateTestNetWallet(){


        if ( !this._scope.masterCluster.isMaster ) { //slave

            setTimeout( () => {

                const wallets = this._scope.wallet.addresses.map( it => it.keys.decryptAddress( ).calculateAddress() );


                this._scope.masterCluster.sendMessage("testnet-wallet", {  wallets }, false );

                this.createTestNetTransactionsToSlaveWallets();

            }, 5000);

        } else {

            this._testnetWallets = [];
            this._testnetWalletsSent = false;

            let count = 0;
            this._scope.masterCluster.on("testnet-wallet", ({wallets}) =>{

                this._scope.logger.warn(this, 'testnet-wallet received', wallets);

                wallets.map( wallet => {

                    const found = this._testnetWallets.reduce( (res, address) => res || address === wallet, false );
                    if (!found)
                        this._testnetWallets.push(wallet);

                } );

                count++;
                if (count === this._scope.masterCluster.stickyMaster.workers.length )
                    this.createTestNetTransactionsToSlaveWallets();

            });

        }

    }

    /**
     * Used to initialize with a new genesis the tests
     * For slave processes, the genesis stackable keys are being shared
     */

    async createTestNetGenesisAndWallet(forced = false) {



        try{

            this._prevBlockEnd = -1;

            if ( forced || !this._scope.wallet._initializedTestNetWallet ) {
                await this._scope.wallet.clearWallet();
                await this._scope.wallet.loadWallet();
                this._scope.wallet._initializedTestNetWallet = true;

            } else {
                await this._scope.wallet.resetWallet();
            }

            const addressWallet = this._scope.wallet.addresses[0];
            if (!addressWallet) throw new Exception(this, "wallet doesn't contain at least one wallet");

            let publicKeyHash, timestamp;

            if ( process.env.SLAVE ){ //slave

                if ( !process.env.BLOCKCHAIN_GENESIS_STAKES_PUBLIC_KEY_HASH ) throw new Exception(this, "process.env.BLOCKCHAIN_GENESIS_STAKES_PUBLIC_KEY_HASH missing");
                if ( !process.env.BLOCKCHAIN_GENESIS_TIMESTAMP ) throw new Exception(this, "process.env.BLOCKCHAIN_GENESIS_TIMESTAMP missing");

                publicKeyHash = Buffer.from( process.env.BLOCKCHAIN_GENESIS_STAKES_PUBLIC_KEY_HASH, "hex");
                timestamp = Number.parseInt( process.env.BLOCKCHAIN_GENESIS_TIMESTAMP );



            } else { //master

                const publicKey = await addressWallet.keys.decryptPublicKey();
                publicKeyHash = this._scope.cryptography.addressGenerator.generatePublicKeyHash( publicKey );

                timestamp = this._scope.genesis.settings.timestamp;

                this._scope.argv.masterCluster.workerEnv = {

                    ...this._scope.argv.masterCluster.workerEnv,
                    BLOCKCHAIN_GENESIS_STAKES_PUBLIC_KEY_HASH: publicKeyHash.toString("hex"),
                    BLOCKCHAIN_GENESIS_TIMESTAMP: timestamp,

                };

            }

            this._scope.genesis.settings.stakes.publicKeyHash = publicKeyHash;
            this._scope.genesis.settings.timestamp = timestamp;

            this._scope.genesisSettings.timestamp = timestamp;
            this._scope.genesisSettings.stakes.publicKeyHash = publicKeyHash;

            this._scope.logger.log(this, "testing - wallet initialization", {
                publicKeyHash: this._scope.genesis.settings.stakes.publicKeyHash.toString("hex"),
            }  );

        }catch(err){
            this._scope.logger.error(this, "createTestNetWallet raised an error", err);
        }

    }

    /**
     *
     * @returns {Promise<void>}
     */

    async createTestNetTransactionsToSlaveWallets(){


        let moneySent = false;
        let processing = false;

        //funding other worker wallets
        this._scope.mainChain.on("blocks/included", async ( {end} )=>{

            if (this._testnetWalletsSent || processing) return;

            try{
                processing = true;

                if (end < this._scope.argv.transactions.staking.stakingMinimumStakeEffectBlockHeight)
                    return;

                const amount = this._scope.argv.transactions.staking.getMinimumStakeRequiredForForging(end) * 80;
                const wallet = await this._scope.wallet.transfer.findWalletAddressThatIsGreaterThanAmount( amount * (this._testnetWallets.length + 1)  );

                if (wallet && !this._testnetWalletsSent){

                    this._testnetWalletsSent = true;

                    try{

                        for (let address of this._testnetWallets)
                            await this._scope.wallet.transfer.transferSimple({
                                address: wallet.keys.decryptAddress(),
                                txDsts: [{
                                    address,
                                    amount,
                                }],
                                extra: {extraMessage: 'Funding testnet cluster address', extraEncryptionOption: '' }
                            });

                        moneySent = true;

                    }catch(err){
                        console.log(err);
                    }
                }
            }finally{
                processing = false;
            }

        });

        this._scope.mainChain.on("blocks/included", async (  { end } )=>{

            if (this._prevBlockEnd >= end) return;
            this._prevBlockEnd = end;

            if ( this._scope.masterCluster.isMaster ) { //master

                if (!this._testnetWalletsSent && !moneySent) return; // i din't send it to

            } else{


            }

            if (processing) return;
            processing = true;

            Helper.sleep(5000).then( async ()=>{

                const count = 12;
                const txs = Math.floor( Math.random()*10 ) + 2;
                const value = Math.floor( Math.random() * 5 +1 );
                const amount = this._scope.argv.transactions.coins.convertToUnits( value ) * count;
                const amountRequired = txs * amount + 2 * this._scope.argv.transactions.staking.getMinimumStakeRequiredForForging( end );
                const wallet = await this._scope.wallet.transfer.findWalletAddressThatIsGreaterThanAmount( amountRequired  );

                if (wallet){

                    try{

                        for (let i=0; i < txs; i++) {

                            const txDsts = [];
                            for (let j=0; j < count; j++) {
                                const privateKeyModel = this._scope.cryptography.addressGenerator.generatePrivateKeyFromMnemonic( ).privateKeyModel;
                                txDsts.push({
                                    address: privateKeyModel.getAddress().calculateAddress(),
                                    amount: amount / count,
                                });
                            }


                            await this._scope.wallet.transfer.transferSimple({
                                address: wallet.keys.decryptAddress(),
                                txDsts,
                            });

                            await Helper.sleep(100);

                        }

                    }catch(err){

                    }

                }

                processing = false;

            });


        });

    }

}