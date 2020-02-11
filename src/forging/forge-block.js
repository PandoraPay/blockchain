const {Helper, Exception} = global.kernel.helpers;

export default class ForgeBlock {

    constructor(scope) {
        this._scope = scope;

        this._hashrate = 0
    }
    
    async createBlockForging(chain = this._scope.mainChain){

        try{

            const block = await chain.createBlock();

            block.pos.fees = await block.sumFees();

            return block;

        }catch(err){
            //this._scope.logger.error(this, "createBlockForging raised an error");
        }

    }

    async forgeBlockWithPrivateKey(block, createTransactionsCallback, stakeForgerPrivateKey, stakeForgerPublicKey, chain = this._scope.mainChain ){


        block.pos.stakeForgerPublicKey = stakeForgerPublicKey;

        //fill POS information into block

        try{
            await block.pos.initializePOS();
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

            //create a local chainData
            let chainData = block._scope.chain.cloneData();

            await this._scope.memPool.includeTransactions( block, createTransactionsCallback, chainData  );

            block.pos.fees = await block.sumFees(); // in case it was changed

            block.totalDifficulty = await block.computeTotalDifficulty( block._scope.chain, chainData);

            await block.pos.signBlockUsingForgerPrivateKey( stakeForgerPrivateKey );

            chainData = block._scope.chain.cloneData();

            if ( await block.pos.validatePOS( block._scope.chain, chainData) === false) throw new Exception(this, "Forging - POS is invalid");

            return true;

        }

        return false;

    }

    async forgeBlockWithWallet(block, createTransactionsCallback){

        const networkTimestampDrift = this._scope.genesis.settings.getDateNow() + this._scope.argv.block.timestamp.timestampDriftMaximum;

        while (block.timestamp < networkTimestampDrift && !this._scope.forging._reset){

            for (let i=0; i < this._scope.wallet.addresses.length && !this._scope.forging._reset; i++){

                const availableStakeAddress = this._scope.wallet.addresses[i];

                const out = await this.forgeBlockWithPrivateKey(block, createTransactionsCallback, availableStakeAddress.decryptPrivateKey(), availableStakeAddress.decryptPublicKey()  );

                if (out)
                    return {
                        result: true,
                        block,
                        availableStakeAddress,
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