const {DBModel} = PandoraLibrary.db;
const {Helper, Exception, BufferHelper, StringHelper} = PandoraLibrary.helpers;
const  {setAsyncInterval, clearAsyncInterval} = PandoraLibrary.helpers.AsyncInterval;

const DelegatedStakeModel = require( "./delegated-stake/delegated-stake-model")
const {WalletStakesSchemaBuilt} = require( "./wallet-stakes-schema-build")

module.exports = class WalletStakesModel extends DBModel{

    constructor(scope, schema = WalletStakesSchemaBuilt, data, type, creationOptions) {

        super(scope, schema, data, type, creationOptions);

        this._initialized = false;

        this.delegatedStakesList = []; //sorted by amount
        this.delegatedStakesMap = {};

    }

    async initializeWalletStakes() {

        if (this._initialized) return true;

        this._scope.masterCluster.on( "wallet-stakes", async data => {

            this._scope.logger.warn(this, "wallet-stakes-message", data.message);

            if (data.message === "is-address-included") {
                return !!this.delegatedStakesMap[data.publicKeyHash];
            }

        });

        this._sortDelegatedStakesInterval = setInterval( this._sortDelegatedStakes.bind(this), 60*1000 );
        this._updateDelegatedStakesAmountInterval = setAsyncInterval( this._updateDelegatedStakesAmount.bind(this), 60*1000 );

        this._initialized = true;
        return true;

    }

    async walletStakeAlreadyIncluded(publicKeyHash){

        if (typeof publicKeyHash === "string" && StringHelper.isHex(publicKeyHash)) publicKeyHash = Buffer.from(publicKeyHash, "hex");
        if (!Buffer.isBuffer(publicKeyHash) || publicKeyHash.length !== 20) throw new Exception(this, 'Invalid PublicKeyHash');

        const out = await this._scope.masterCluster.send( "wallet-stakes", {
            message: "is-address-included",
            publicKeyHash: publicKeyHash.toString('hex'),
        }, true, true);

        return out.reduce( (res, it) => res || it, false );
    }

    async addWalletStake({publicKey, delegateStakePrivateKey}){

        if (typeof publicKey === "string" && StringHelper.isHex(publicKey)) publicKey = Buffer.from(publicKey, "hex");
        if (typeof delegateStakePrivateKey === "string" && StringHelper.isHex(delegateStakePrivateKey)) delegateStakePrivateKey = Buffer.from(delegateStakePrivateKey, "hex");

        const delegateStakePrivateKeyModel = this._scope.cryptography.addressGenerator.generatePrivateKeyModelFromPrivateKey(delegateStakePrivateKey);
        const delegateStakePublicKeyModel = delegateStakePrivateKeyModel.getAddress();

        const publicKeyHash = this._scope.cryptography.addressGenerator.generatePublicKeyHash( publicKey );

        const stakingAmount = await this._scope.mainChain.data.accountHashMap.getBalance( publicKeyHash );
        if ( (stakingAmount || 0 ) < this._scope.argv.transactions.staking.getMinimumStakeRequiredForForging( this._scope.mainChain.data.end ) )
            throw new Exception(this, "Your don't have enough funds for staking or the node is not sync!", {stakingAmount} );

        const delegate = await this._scope.mainChain.data.accountHashMap.getDelegate( publicKeyHash );
        if (!delegate || !delegate.delegateStakePublicKeyHash.equals( delegateStakePublicKeyModel.publicKeyHash ))
            throw new Exception(this, "You need to delegate your stake to the following public key", delegateStakePublicKeyModel.publicKeyHash );

        const lock = await this.lock(-1, -1, 50, publicKeyHash.toString("hex") );

        let result = false;

        try{

            const exists = await this._scope.masterCluster.sendMessage( "wallet-stakes", {
                message: "wallet-stakes/update-delegate-stake",
                publicKeyHash: publicKeyHash.toString("hex"),
                delegateStakePublicKeyHash: delegateStakePublicKeyHash.toString("hex"),
                delegateStakePrivateKey: delegateStakePublicKeyModel.privateKey.toString("hex"),
            }, true, true );

            //this._scope.logger.log(this, "exists", exists);

            for (let i=0; i < exists.length; i++)
                if ( exists[i] )
                    return true;

            if (this.delegatedStakesList.length >= this._scope.argv.walletStakes.maximumDelegates)
                throw new Exception(this, "Node is full of stake delegates ");

            const delegateStake = this._createSimpleModelObject( DelegatedStakeModel, undefined, "delegatedStakesStored", {
                id: publicKeyHash.toString("hex"),
                publicKey: publicKey.toString("hex"),
                publicKeyHash: publicKeyHash.toString("hex"),
                delegateStakePublicKeyHash: delegateStakePublicKeyHash.toString("hex"),
                delegateStakePrivateKey: delegateStakePrivateKey.toString("hex"),
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
        const blockHeight = this._scope.mainChain.data.end;
        return this.delegatedStakesList.sort( (a,b) => ( b.checkStake(blockHeight) ? b.amount : 0 ) - ( a.checkStake(blockHeight) ? a.amount : 0) ); //from max to min
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
        if (!delegate || !delegate.delegateStakePublicKeyHash.equals( delegatedStake.delegateStakePublicKeyHash ))
            delegatedStake.errorDelegatePrivateKeyChanged = true;
        else
            delegatedStake.errorDelegatePrivateKeyChanged = false;

        await delegatedStake.save();

    }

}