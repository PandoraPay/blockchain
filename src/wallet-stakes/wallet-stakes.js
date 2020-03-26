const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper, StringHelper} = global.kernel.helpers;
const  {setAsyncInterval, clearAsyncInterval} = global.kernel.helpers.AsyncInterval;

import DelegatedStake from "./delegated-stake/delegated-stake"

export default class WalletStakes extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "walletStakes",
                    fixedBytes: 12,
                },

            }

        }, schema, false), data, type, creationOptions);

        this.dataSubscription = new DBSchema(this._scope, { fields: {  table: { default: "walletStakes", fixedBytes: 12 } }});

        this._initialized = false;

        this.delegatedStakes = []; //sorted by amount
        this.delegatedStakesMap = {};

    }

    async initializeWalletStakes() {

        if (this._initialized) return true;


        await this.dataSubscription.subscribe();
        this.dataSubscription.subscription.on( async message => {

            this._scope.logger.warn(this, "wallet-stakes-message", message.name);

            if (message.name === "update-delegate-stake") {

                try {
                    const {publicKeyHash, delegatePublicKey, delegatePrivateKey} = message.data;


                    const oldDelegateStake = this.delegatedStakesMap[publicKeyHash];
                    if (oldDelegateStake) {

                        if (oldDelegateStake.delegatePublicKey.toString("hex") === delegatePublicKey && oldDelegateStake.delegatePrivateKey.toString("hex") === delegatePrivateKey )
                            return true;

                        oldDelegateStake.delegatePublicKey = delegatePublicKey;
                        oldDelegateStake.delegatePrivateKey = delegatePrivateKey;

                        await oldDelegateStake.save();

                        return true;
                    }

                    return false;

                } catch (err) {
                    this._scope.logger.error(this, "update-delegate-stake raised an error", err);
                }

            } else
            if (message.name === "get-delegator-stake-private-key") { //used to get the master

                const {publicKey} = message.data;

                const delegatorStakePrivateAddress = this._scope.wallet.addresses[0].keys.decryptDelegatorStakePrivateAddress( publicKey );
                return delegatorStakePrivateAddress.privateKey.toString("hex");

            }

        });

        this._sortDelegatedStakesInterval = setInterval( this._sortDelegatedStakes.bind(this), 60*1000 );
        this._updateDelegatedStakesAmountInterval = setAsyncInterval( this._updateDelegatedStakesAmount.bind(this), 60*1000 );

        this._initialized = true;
        return true;

    }

    async addWalletStake({publicKey, delegatePublicKey, delegatePrivateKey}){

        if (typeof publicKey === "string" && StringHelper.isHex(publicKey)) publicKey = Buffer.from(publicKey, "hex");
        if (typeof delegatePublicKey === "string" && StringHelper.isHex(delegatePublicKey)) delegatePublicKey = Buffer.from(delegatePublicKey, "hex");
        if (typeof delegatePrivateKey === "string" && StringHelper.isHex(delegatePrivateKey)) delegatePrivateKey = Buffer.from(delegatePrivateKey, "hex");

        const delegatorStakePrivateAddress = this._scope.cryptography.addressGenerator.generatePrivateAddressFromPrivateKey(delegatePrivateKey);

        if ( !delegatorStakePrivateAddress.publicKey.equals(delegatePublicKey) )
            throw new Exception(this, "Your stake delegate's public key is not matching with the private key", delegatorStakePrivateAddress.publicKey );

        const publicKeyHash = this._scope.cryptography.addressGenerator.generatePublicKeyHash( publicKey );

        const stakingAmount = await this._scope.mainChain.data.accountHashMap.getBalance( publicKeyHash );
        if ( (stakingAmount || 0 ) < this._scope.argv.transactions.coins.convertToUnits(this._scope.argv.transactions.staking.stakingMinimumStake) )
            throw new Exception(this, "Your don't have enough funds for staking or the node is not sync!", {stakingAmount} );

        const delegate = await this._scope.mainChain.data.accountHashMap.getDelegate( publicKeyHash );
        if (!delegate || !delegate.delegatePublicKey.equals( delegatePublicKey ))
            throw new Exception(this, "You need to delegate your stake to the following public key", delegatePublicKey );

        const lock = await this.lock(-1, publicKeyHash.toString("hex") );

        let result = false;

        try{

            const exists = await this.dataSubscription.subscribeMessage("update-delegate-stake", {
                publicKeyHash: publicKeyHash.toString("hex"),
                delegatePublicKey: delegatePublicKey.toString("hex"),
                delegatePrivateKey: delegatePrivateKey.toString("hex"),
            }, true, true );

            //this._scope.logger.log(this, "exists", exists);

            for (let i=0; i < exists.length; i++)
                if ( exists[i] ){
                    lock();
                    return true;
                }

            if (this.delegatedStakes.length >= this._scope.argv.walletStakes.maximumDelegates)
                throw new Exception(this, "Node is full of stake delegates ");

            const delegateStake = new DelegatedStake(this._scope,undefined, {
                id: publicKeyHash.toString("hex"),
                publicKey: publicKey.toString("hex"),
                publicKeyHash: publicKeyHash.toString("hex"),
                delegatePublicKey: delegatePublicKey.toString("hex"),
                delegatePrivateKey: delegatePrivateKey.toString("hex"),
                amount: stakingAmount,
                errorDelegatePrivateKeyChanged: false,
            });

            this.delegatedStakes.push(delegateStake);
            this.delegatedStakesMap[delegateStake.id] = delegateStake;

            await delegateStake.save();

            result = true;
        }catch(err){
            lock();
            throw err;
        }

        lock();
        return result;
    }

    async clearWalletStakes(save = true){

        await this.delete();

        await this._scope.db.deleteAll( DelegatedStake );
        this.delegatedStakes = [];
        this.delegatedStakesMap = {};

        if (save)
            await this.save();
    }

    onLoaded(){
        

    }

    async loadWalletStakes(){

        if (await this.exists() )
            await this.load();


        const out = await this._scope.db.findAll( DelegatedStake );

        if (out){

            for (const delegateStake in out) {
                this.delegatedStakes.push(delegateStake);
                this.delegatedStakesMap[delegateStake.id] = delegateStake;
            }

        }


        return true;
    }

    _sortDelegatedStakes(){
        return this.delegatedStakes.sort( (a,b) => ( b.checkStake() ? b.amount : 0 ) - ( a.checkStake() ? a.amount : 0) ); //from max to min
    }

    async _updateDelegatedStakesAmount(){

        if (!this.delegatedStakes.length) return;

        const index = Math.floor( Math.random() * this.delegatedStakes.length );
        const delegatedStake = this.delegatedStakes[index];

        let stakingAmount = await this._scope.mainChain.data.accountHashMap.getBalance( delegatedStake.publicKeyHash );
        if (!stakingAmount) stakingAmount = 0;

        if (delegatedStake.amount !== stakingAmount)
            delegatedStake.amount = stakingAmount;

        const delegate = await this._scope.mainChain.data.accountHashMap.getDelegate( delegatedStake.publicKeyHash );
        if (!delegate || !delegate.delegatePublicKey.equals( delegatedStake.delegatePublicKey ))
            delegatedStake.errorDelegatePrivateKeyChanged = true;
        else
            delegatedStake.errorDelegatePrivateKeyChanged = false;

        await delegatedStake.save();

    }

}