const {DBModel} = require('kernel').db;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;
const {BN, bn128} = require('kernel').utils;
const {TxTokenCurrencyTypeEnum} = require('cryptography').transactions;

const {BlockPoSSchemaBuilt} = require('./block-pos-schema-build')

module.exports = class BlockPoSModel extends DBModel {

    constructor(scope, schema = BlockPoSSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    get block(){
        return this._scope.parent;
    }

    get stakeForgerPublicKeyHash(){

        if (!this._stakeForgerPublicKeyHash)
            this._stakeForgerPublicKeyHash = this._scope.cryptography.addressGenerator.generatePublicKeyHash(this.stakeForgerPublicKey);

        return this._stakeForgerPublicKeyHash;
    }

    get stakeForgerAddress(){

        if (!this._stakeForgerAddress)
            this._stakeForgerAddress = this._scope.cryptography.addressGenerator.generateAddressFromPublicKey( this.stakeForgerPublicKey ).calculateAddress();

        return this._stakeForgerAddress;

    }

    get stakeDelegateRewardAddress(){

        if (!this._stakeDelegateRewardAddress)
            this._stakeDelegateRewardAddress = this._scope.cryptography.addressGenerator.generateAddressFromPublicKeyHash( this.stakeDelegateRewardPublicKeyHash ).calculateAddress();

        return this._stakeDelegateRewardAddress;
    }

    get isStakeDelegateRewardPublicKeyHashEmpty(){
        return !this.stakeDelegateRewardPublicKeyHash.length;
    }

    async _getStakeDelegateForgerPublicKeyHash(chain = this._scope.chain, chainData = chain.data){

        const accountNode = await chainData.accountHashMap.getAccountNode(this.stakeForgerPublicKeyHash);
        if (!accountNode) throw new Exception(this, "Account was not found");

        let delegateStakeForgerPublicKeyHash;

        let delegated;
        if ( !accountNode.delegate.delegatePublicKeyHash.length || accountNode.delegate.delegatePublicKeyHash.equals( this.stakeForgerPublicKeyHash ) ) { //empty no delegation
            delegated = false;
        }
        else {
            delegateStakeForgerPublicKeyHash = accountNode.delegate.delegatePublicKeyHash;
            delegated = true;
        }

        return {
            delegateStakeForgerPublicKeyHash,
            delegated,
            delegateFee: accountNode.delegate.delegateFee,
            delegateNonce: accountNode.delegate.delegateNonce,
            accountNode,
        }
    }


    async validatePOS(chain = this._scope.chain, chainData = chain.data){

        const minimumStake = this._scope.argv.transactions.staking.getMinimumStakeRequiredForForging(this.block.height );
        if (this.stakingAmount < minimumStake)
            throw new Exception(this, "for staking it requires a minimum threshold", {minimumStake, availableStake: this.stakingAmount});

        let funds = await chainData.accountHashMap.getBalance( this.stakeForgerPublicKeyHash, TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer );

        if (funds === undefined) throw new Exception(this, "Account not found", { forgerPublicKeyHash: this.stakeForgerPublicKeyHash,  stakeForgerPublicKey: this.stakeForgerPublicKey});

        const lockedFunds = await chainData.getGrindingLockedTransfersFunds(this.stakeForgerPublicKeyHash);
        funds = funds - lockedFunds;

        this._scope.logger.info(this, 'validatePOS locked funds', {forger: this.stakeForgerPublicKeyHash.toString('hex'), lockedFunds } );

        if (funds !== this.stakingAmount) throw new Exception(this, "Account balance is not right", { balance: funds, stakingAmount: this.stakingAmount });

        //verify signature
        const { delegateStakeForgerPublicKeyHash } = await this._getStakeDelegateForgerPublicKeyHash(chain, chainData);

        if ( !this._scope.cryptography.cryptoSignature.verify( this._blockHashForForgerSignature(), this.stakeForgerSignature, this.stakeForgerPublicKey ) )
            throw new Exception(this, "POS signature is invalid");

        if (delegateStakeForgerPublicKeyHash && !delegateStakeForgerPublicKeyHash.equals( this.stakeForgerPublicKeyHash ))
            throw new Exception(this, "POS delegate stake forger publick key hash is not matching");

        return true;
    }

    async _getRewardDistribution(chain = this._scope.chain, chainData = chain.data){

        const fees = await this.block.sumFees();
        const coinbase = this._scope.argv.transactions.coinbase.getBlockRewardAt( this.block.height, chainData.circulatingSupply );

        const sum = fees;
        sum[ TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id ] =  (sum[TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id] || 0) + coinbase; //reward

        const { delegated,  delegateFee } = await this._getStakeDelegateForgerPublicKeyHash(chain, chainData);

        let distributions = {};

        //not delegated or reward address not specified
        if ( !delegated || this.stakeDelegateRewardPublicKeyHash.length ){ //me

            for (const tokenCurrency in sum){
                distributions[tokenCurrency] = {
                    owner: sum[tokenCurrency],  //owner
                    delegator: 0,  //owner
                }
            }

        } else { //delegated

            const percentFee = delegateFee / this._scope.argv.transactions.staking.delegateStakingFeePercentage;
            if (percentFee < 0 || percentFee > 1) throw new Exception(this, "Percent is invalid", {percentFee});

            for (const tokenCurrency in sum){

                const delegatorFee = Math.round( sum[tokenCurrency] * percentFee );

                distributions[tokenCurrency] = {
                    owner: sum[tokenCurrency] - delegatorFee, //owner
                    delegator: delegatorFee, //delegator
                }
            }

        }

        return {
            distributions,
            coinbase,
        };

    }

    async addBlockPOS(chain = this._scope.chain, chainData = chain.data, block){

        //update miner balance with coinbase reward and fee
        try{

            const {distributions, coinbase} = await this._getRewardDistribution(chain, chainData);

            chainData.circulatingSupply = chainData.circulatingSupply + coinbase;

            for (const tokenCurrency in distributions){

                if ( distributions[tokenCurrency].owner > 0 )
                    await chainData.accountHashMap.updateBalance( this.stakeForgerPublicKeyHash, distributions[tokenCurrency].owner, tokenCurrency );

                if (distributions[tokenCurrency].delegator){
                    await chainData.accountHashMap.updateBalance(this.stakeDelegateRewardPublicKeyHash, distributions[tokenCurrency].delegator, tokenCurrency);
                    this._scope.logger.warn(this, 'addBlocKPOS Distribution', { distribution: distributions[tokenCurrency], sum: distributions[tokenCurrency].owner + distributions[tokenCurrency].delegator });
                }
            }

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, 'Error Updating reward balance');

            return false;
        }

        return true;
    }

    async removeBlockPOS(chain = this._scope.chain, chainData = chain.data, block){

        //update miner balance with coinbase reward and fee
        try{

            const {distributions, coinbase} = await this._getRewardDistribution(chain, chainData);

            for (const tokenCurrency in distributions){

                if (distributions[tokenCurrency].delegator){
                    await chainData.accountHashMap.updateBalance(this.stakeDelegateRewardPublicKeyHash, -distributions[tokenCurrency].delegator, tokenCurrency);
                    this._scope.logger.warn(this, 'addBlocKPOS Distribution', { distribution: distributions[tokenCurrency], sum: distributions[tokenCurrency].owner + distributions[tokenCurrency].delegator });
                }

                if ( distributions[tokenCurrency].owner > 0 )
                    await chainData.accountHashMap.updateBalance( this.stakeForgerPublicKeyHash, -distributions[tokenCurrency].owner, tokenCurrency );
            }

            chainData.circulatingSupply = chainData.circulatingSupply - coinbase;

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, 'Error Updating reward balance');

            return false;
        }

        return true;

    }

    signBlockUsingForgerPrivateKey(privateKey){

        const signature = this._scope.cryptography.cryptoSignature.sign( this._blockHashForForgerSignature(), privateKey );
        this.stakeForgerSignature = signature;
        
        return signature;
        
    }

    /**
     * Used to sign the block with the forging transaction
     * @returns {*}
     */
    _blockHashForForgerSignature(){

        return this.block.hash( false, {

            onlyFields:{
                height: true,
                version: true,
                prevHash: true,
                prevKernelHash: true,
                timestamp: true,
                target: true,
                totalDifficulty: true,
                transactionsMerkleTree: true,
                newTokens: true,
                pos:{
                    stakingAmount: true,
                    stakeForgerPublicKey: true,
                    stakeDelegateRewardPublicKeyHash: true,
                }
            }
            
        });

    }

    kernelHash(){

        if (this.stakingAmount === 0) throw new Exception(this, "either the POS input was not loaded or it is zero");

        const kernelHash = this.block.hash( false, {
            onlyFields:{
                timestamp: true,
                prevKernelHash: true,
                pos:{
                    stakeForgerPublicKey: true,
                }
            }
        });

        let newKernelHash = new BN( kernelHash.toString("hex"), 16 ).div( new BN( this.stakingAmount) );
        newKernelHash = BN.min( newKernelHash, this._scope.argv.block.difficulty.maxTargetBigNumber );
        newKernelHash = BN.max( newKernelHash, new BN(0) );

        const bufferKernelHash = Buffer.from( newKernelHash.toString(16, 64), "hex");

        return bufferKernelHash;

    }

}