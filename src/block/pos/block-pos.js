const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;
const {BN, bn128} = global.kernel.utils;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

export default class BlockPoS extends DBSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    stakeForgerPublicKey: {
                        type: "buffer",
                        fixedBytes: 33,

                        preprocessor(publicKey){
                            delete this._stakeForgerPublicKeyHash;
                            delete this._stakeForgerAddress;
                            return publicKey;
                        },

                        position: 101,
                    },

                    stakingAmount: {
                        type: "number",

                        position: 102,
                    },

                    /**
                     * Public Key Hash (address) where the reward will go
                     */
                    stakeDelegateRewardPublicKeyHash:{
                        type: "buffer",
                        fixedBytes: 20,

                        removeLeadingZeros: true,

                        preprocessor(stakeDelegateRewardPublicKeyHash){
                            delete this._stakeDelegateRewardAddress;
                            return stakeDelegateRewardPublicKeyHash;
                        },

                        position : 103
                    },

                    /**
                     * Forger signature
                     */
                    stakeForgerSignature: {
                        type: "buffer",
                        fixedBytes: 65,

                        position: 104,
                    },


                },

                options: {
                    hashing: {
                        enabled: true,
                        fct: b => b,
                    }
                },

                saving:{
                    storeDataNotId: true,
                },

            },
            schema, false), data, type, creationOptions);

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
        return this.stakeDelegateRewardPublicKeyHash.equals( Buffer.alloc(20) );
    }

    async _getStakeDelegateForgerPublicKeys(chain = this._scope.chain, chainData = chain.data){

        const accountNode = await chainData.accountHashMap.getAccountNode(this.stakeForgerPublicKeyHash);
        if (!accountNode) throw new Exception(this, "Account was not found");

        let delegateStakeForgerPublicKey;

        let delegated;
        if (accountNode.delegate.delegatePublicKey.equals( Buffer.alloc(33) ) || accountNode.delegate.delegatePublicKey.equals( this.stakeForgerPublicKey ) ) { //empty no delegation
            delegateStakeForgerPublicKey = this.stakeForgerPublicKey;
            delegated = false;
        }
        else {
            delegateStakeForgerPublicKey = accountNode.delegate.delegatePublicKey;
            delegated = true;
        }

        return {
            delegateStakeForgerPublicKey,
            delegated,
            delegateFee: accountNode.delegate.delegateFee,
            delegateNonce: accountNode.delegate.delegateNonce,
            accountNode,
        }
    }


    async validatePOS(chain = this._scope.chain, chainData = chain.data){

        if (this.block.height >= this._scope.argv.transactions.staking.stakingMinimumStakeEffect && this.stakingAmount < this._scope.argv.transactions.coins.convertToUnits(this._scope.argv.transactions.staking.stakingMinimumStake) )
            throw new Exception(this, "not enough coins for staking");

        if (this.stakingAmount < this._scope.argv.transactions.coinbase.getBlockRewardAt(0)) throw new Exception(this, "for staking it requires at least 1 coin");

        const out = await chainData.accountHashMap.getBalance( this.stakeForgerPublicKeyHash, TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id);

        if (out === undefined) throw new Exception(this, "Account not found", {
            forgerPublicKeyHash: this.stakeForgerPublicKeyHash,
            stakeForgerPublicKey: this.stakeForgerPublicKey
        });

        if (out !== this.stakingAmount) throw new Exception(this, "Account balance is not right", { balance: out, stakingAmount: this.stakingAmount });

        //verify signature
        const { delegateStakeForgerPublicKey } = await this._getStakeDelegateForgerPublicKeys(chain, chainData);

        if ( !this._scope.cryptography.cryptoSignature.verify( this._blockHashForForgerSignature(), this.stakeForgerSignature, delegateStakeForgerPublicKey ) )
            throw new Exception(this, "POS signature is invalid");

        return true;
    }

    async _getRewardDistribution(chain = this._scope.chain, chainData = chain.data){

        const fees = await this.block.sumFees();
        const coinbase = this._scope.argv.transactions.coinbase.getBlockRewardAt( this.block.height );

        const sum = fees + coinbase;

        const { delegated,  delegateFee } = await this._getStakeDelegateForgerPublicKeys(chain, chainData);

        let distribution1, //owner
            distribution2; //delegator

        //not delegated or reward address not specified
        if ( !delegated || this.stakeDelegateRewardPublicKeyHash.equals( Buffer.alloc(20) ) ){ //me
            distribution1 = sum; //owner
            distribution2 = 0;   //delegator
        } else { //delegated
            const percentFee = delegateFee / this._scope.argv.transactions.staking.delegateStakingFeePercentage;
            if (percentFee < 0 || percentFee > 1) throw new Exception(this, "Percent is invalid", {percentFee});

            distribution2 = Math.round( sum * percentFee ); //delegator
            distribution1 = sum - distribution2;               //owner
        }

        return {distribution1, distribution2 };

    }

    async addBlockPOS(chain = this._scope.chain, chainData = chain.data, block){

        //update miner balance with coinbase reward and fee
        try{

            const {distribution1, distribution2} = await this._getRewardDistribution(chain, chainData);

            if (distribution2)
                this._scope.logger.warn(this, 'addBlocKPOS Distribution', {distribution1, distribution2, sum: distribution1 + distribution2});

            if (distribution1 > 0) //owner
                await chainData.accountHashMap.updateBalance( this.stakeForgerPublicKeyHash, distribution1 );

            if (distribution2 > 0) //reward delegator
                await chainData.accountHashMap.updateBalance( this.stakeDelegateRewardPublicKeyHash, distribution2 );

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

            const {distribution1, distribution2} = await this._getRewardDistribution(chain, chainData);

            if (distribution2)
                this._scope.logger.warn(this, 'removeBlockPOS Distribution', {distribution1, distribution2, sum: distribution1 + distribution2});

            if (distribution2 > 0)
                await chainData.accountHashMap.updateBalance( this.stakeDelegateRewardPublicKeyHash, - distribution2 );

            if (distribution1 > 0)
                await chainData.accountHashMap.updateBalance( this.stakeForgerPublicKeyHash, - distribution1 );

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