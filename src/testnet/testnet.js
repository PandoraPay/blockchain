const {Exception} = global.kernel.helpers;

export default class TestNet{

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

                const wallets = this._scope.wallet.addresses.map( it => it.decryptPublicAddress( ).calculateAddress() );
                this._scope.masterCluster.sendMessage("testnet-wallet", {wallets: wallets}, false );

                this.createTestNetTransactionsToSlaveWallets();

            }, 5000);

        } else {

            this._testnetWallets = [];
            this._testnetWalletsSent = false;

            let count = 0;
            this._scope.masterCluster.on("testnet-wallet", ({wallets}) =>{


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

                const publicKey = await addressWallet.decryptPublicKey();
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
        this._scope.mainChain.on("blocks/included", async ()=>{

            if (this._testnetWalletsSent || processing) return;

            processing = true;
            const value = this._scope.argv.transactions.staking.stakingMinimumStake * 80;
            const amount = this._scope.argv.transactions.coins.convertToUnits(value ) ;
            const wallet = await this._scope.wallet.transfer.findWalletAddressThatIsGreaterThanAmount( amount * (this._testnetWallets.length + 1)  );

            if (wallet && !this._testnetWalletsSent){

                console.log("wallet has money", amount, this._testnetWallets );
                this._testnetWalletsSent = true;

                try{

                    for (let address of this._testnetWallets)
                        await this._scope.wallet.transfer.transferSimple({
                            address: wallet.decryptPublicAddress(),
                            txDsts: [{
                                address,
                                amount,
                            }]
                        });

                    moneySent = true;

                }catch(err){
                    console.log(err);
                }
            }

            processing= false;


        });

        this._scope.mainChain.on("blocks/included", async (  { data } )=>{

            const {end} = data;


            if (this._prevBlockEnd >= end) return;
            this._prevBlockEnd = end;

            if ( this._scope.masterCluster.isMaster ) { //master

                if (!this._testnetWalletsSent && !moneySent) return; // i din't send it to

            } else{
            }

            if (processing) return;
            processing = true;

            const count = 12;
            const txs = Math.floor( Math.random()*10 ) + 2;
            const value = Math.floor( Math.random() * 5 +1 );
            const amount = this._scope.argv.transactions.coins.convertToUnits( value ) * count;
            const amountRequired = txs * amount + this._scope.argv.transactions.coins.convertToUnits( 2 * this._scope.argv.transactions.staking.stakingMinimumStake  );
            const wallet = await this._scope.wallet.transfer.findWalletAddressThatIsGreaterThanAmount( amountRequired  );

            if (wallet){

                try{

                    for (let i=0; i < txs; i++) {

                        const txDsts = [];
                        for (let j=0; j < count; j++) {
                            const privateAddress = this._scope.cryptography.addressGenerator.generateAddressFromMnemonic( ).privateAddress;
                            txDsts.push({
                                address: privateAddress.getAddress().calculateAddress(),
                                amount: amount / count,
                            });
                        }


                        await this._scope.wallet.transfer.transferSimple({
                            address: wallet.decryptPublicAddress(),
                            txDsts,
                        });

                    }

                }catch(err){

                }

            }
            processing = false;

        });

    }

}