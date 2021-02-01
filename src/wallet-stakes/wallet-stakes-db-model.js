const {DBModel} = require('kernel').db;
const {Helper, Exception, BufferHelper, StringHelper} = require('kernel').helpers;
const  {setAsyncInterval, clearAsyncInterval} = require('kernel').helpers.AsyncInterval;

const DelegatedStakeDBModel = require( "./delegated-stake/delegated-stake-db-model")
const {WalletStakesDBSchemaBuilt} = require( "./wallet-stakes-db-schema-build")

module.exports = class WalletStakesDBModel extends DBModel{

    constructor(scope, schema = WalletStakesDBSchemaBuilt, data, type, creationOptions) {

        super(scope, schema, data, type, creationOptions);

        this._initialized = false;

        this.delegatedStakesList = []; //sorted by amount
        this.delegatedStakesMap = {};

    }

    async initializeWalletStakes() {

        if (this._initialized) return true;

        this._scope.masterCluster.on( "wallet-stakes", async data => {

            this._scope.logger.warn(this, "wallet-stakes-message", data.message);

            if (data.message === "wallet-stakes/update-delegate-stake") {

                try {
                    const {publicKeyHash, delegatePublicKey, delegatePrivateKey} = data;


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
            if (data.message === "wallet-stakes/get-delegator-stake-private-key") { //used to get the master

                const {publicKey} = data;

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

            const exists = await this._scope.masterCluster.sendMessage( "wallet-stakes", {
                message: "wallet-stakes/update-delegate-stake",
                publicKeyHash: publicKeyHash.toString("hex"),
                delegatePublicKey: delegatePublicKey.toString("hex"),
                delegatePrivateKey: delegatePrivateKey.toString("hex"),
            }, true, true );

            //this._scope.logger.log(this, "exists", exists);

            for (let i=0; i < exists.length; i++)
                if ( exists[i] )
                    return true;

            if (this.delegatedStakesList.length >= this._scope.argv.walletStakes.maximumDelegates)
                throw new Exception(this, "Node is full of stake delegates ");

            const delegateStake = this._createSimpleModelObject( DelegatedStakeDBModel, undefined, "delegatedStakesStored", {
                id: publicKeyHash.toString("hex"),
                publicKey: publicKey.toString("hex"),
                publicKeyHash: publicKeyHash.toString("hex"),
                delegatePublicKey: delegatePublicKey.toString("hex"),
                delegatePrivateKey: delegatePrivateKey.toString("hex"),
                amount: stakingAmount,
                errorDelegatePrivateKeyChanged: false,
            }, "object" );

            this.delegatedStakesList.push(delegateStake);
            this.delegatedStakesMap[delegateStake.id] = delegateStake;

            await delegateStake.save();

            result = true;
        }catch(err){
            this._scope.logger.error(this, 'Error adding wallet stake', {publicKeyHash} )
        }finally{
            if (typeof lock === "function") lock();
        }

        return result;
    }

    async clearWalletStakes(save = true){

        await this.delete();

        this.delegatedStakesList = [];
        this.delegatedStakesMap = {};

        if (save)
            await this.save();
    }

    onLoaded(){
        

    }

    async loadWalletStakes(){

        if (await this.exists() )
            await this.load();

        for (const delegateStake of this.delegatedStakesStored) {
            this.delegatedStakesList.push(delegateStake);
            this.delegatedStakesMap[delegateStake.id] = delegateStake;
        }

        return true;
    }

    _sortDelegatedStakes(){
        return this.delegatedStakesList.sort( (a,b) => ( b.checkStake() ? b.amount : 0 ) - ( a.checkStake() ? a.amount : 0) ); //from max to min
    }

    async _updateDelegatedStakesAmount(){

        if (!this.delegatedStakesList.length) return;

        const index = Math.floor( Math.random() * this.delegatedStakesList.length );
        const delegatedStake = this.delegatedStakesList[index];

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