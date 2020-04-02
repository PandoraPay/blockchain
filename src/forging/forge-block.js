const {Helper, Exception} = global.kernel.helpers;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

export default class ForgeBlock {

    constructor(scope) {
        this._scope = scope;

        this._hashrate = 0
    }

    async _initializeBlockPOS(block, chain = block._scope.chain, chainData = chain.data){

        let funds = await chain.data.accountHashMap.getBalance( block.pos.stakeForgerPublicKeyHash, TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id);

        //showing the number of coins
        //this._scope.logger.log(this, "I have money: ", this.stakeForgerPublicKeyHash.toString("hex"), out);

        if (funds === undefined) throw new Exception(this, "Account not found", { forgerPublicKeyHash: block.stakeForgerPublicKeyHash,  stakeForgerPublicKey: block.stakeForgerPublicKey });

        const lockedFunds = await chainData.getGrindingLockedTransfersFunds(block.pos.stakeForgerPublicKeyHash);
        funds = funds - lockedFunds;

        if (block.height >= this._scope.argv.transactions.staking.stakingMinimumStakeEffect && funds < this._scope.argv.transactions.coins.convertToUnits(this._scope.argv.transactions.staking.stakingMinimumStake) )
            throw new Exception(this, "not enough coins for staking");

        if (funds < this._scope.argv.transactions.coinbase.getBlockRewardAt(0) ) throw new Exception(this, "for staking it requires at least 1 coin");

        block.pos.stakingAmount = funds;

    }

    async createBlockForging(chain = this._scope.mainChain){

        try{

            const block = await chain.createBlock();

            return block;

        }catch(err){
            //this._scope.logger.error(this, "createBlockForging raised an error");
        }

    }

    async forgeBlockWithPrivateKey(block, createTransactionsCallback, stakeForgerPublicKey, stakeForgerDelegatePrivateKey, walletStakeDelegateRewardPublicKeyHash){


        block.pos.stakeForgerPublicKey = stakeForgerPublicKey;


        //fill POS information into block

        try{

            //initialize block pos
            await this._initializeBlockPOS(block);

        }catch(err){

            // if (this._scope.argv.debug.enabled)
            //     this._scope.logger.error(this, "foreBlock initializePOS raised an error", err);

            return false;
        }

        const kernelHash = block.kernelHash();
        this._hashrate++;

        //getting the stakeOutput
        if ( kernelHash.compare ( block.target ) <= 0 ){

            console.log("");
            this._scope.logger.info(this, "SOLUTION!!!", {height: block.height});
            this._scope.logger.info(this, block.target.toString("hex"));
            console.log("");

            const {delegated, delegateFee} = await block.pos._getStakeDelegateForgerPublicKeys();

            if ( delegated && delegateFee )
                block.pos.stakeDelegateRewardPublicKeyHash = walletStakeDelegateRewardPublicKeyHash;


            //create a local chainData
            let chainData = block._scope.chain.cloneData();

            await this._scope.memPool.includeTransactions( block, createTransactionsCallback, block._scope.chain, chainData  );

            block.tokens = await block.transactionsMerkleTree.tokensCount();
            block.totalDifficulty = await block.computeTotalDifficulty( block._scope.chain, chainData);

            await block.pos.signBlockUsingForgerPrivateKey( stakeForgerDelegatePrivateKey );

            chainData = block._scope.chain.cloneData();

            if ( await block.pos.validatePOS( block._scope.chain, chainData) !== true) throw new Exception(this, "Forging - POS is invalid");

            return true;

        }

        return false;

    }

    async forgeBlockWithWallet(block, createTransactionsCallback){

        const networkTimestampDrift = this._scope.genesis.settings.getDateNow() + this._scope.argv.block.timestamp.timestampDriftMaximum;

        const walletStakeDelegateRewardPublicKeyHash = this._scope.wallet.addresses[0].keys.decryptPublicKeyHash();

        while (block.timestamp < networkTimestampDrift && !this._scope.forging._reset){

            //my own addresses
            for (let i=0; i < this._scope.wallet.addresses.length && !this._scope.forging._reset; i++){

                const availableStakeAddress = this._scope.wallet.addresses[i];

                const out = await this.forgeBlockWithPrivateKey(block, createTransactionsCallback, availableStakeAddress.keys.decryptPublicKey(), availableStakeAddress.keys.decryptPrivateKey(), walletStakeDelegateRewardPublicKeyHash  );

                if (out)
                    return {
                        result: true,
                        block,
                        availableStakeAddress,
                    };

            }

            //delegatedStakes to coldStaking
            for (let i=0; i < this._scope.walletStakes.delegatedStakes.length && !this._scope.forging._reset; i++){

                const delegatedStake = this._scope.walletStakes.delegatedStakes[i];

                if ( !delegatedStake.checkStake() ) break; //they are all sorted

                const out = await this.forgeBlockWithPrivateKey(block, createTransactionsCallback, delegatedStake.publicKey, delegatedStake.delegatePrivateKey, walletStakeDelegateRewardPublicKeyHash  );

                if (out)
                    return {
                        result: true,
                        block,
                        delegatedStake,
                    };

            }

            block.timestamp = block.timestamp + 1;
            //this._scope.logger.log(this, "forging: ", block.kernelHash().toString("hex") );

        }


    }


    resetHashrate(){

        this.hashrate = this._hashrate || 0;
        this._hashrate = 0;

        return this.hashrate;
    }

}