module.exports = {

    stakingMinimumStakeEffect: 100,

    stakingGrindingLockedTransfersBlocks: 50, // Used to solve "Stake Griding Attack Vector" for POS by locking the funds sent from transactions

    delegateStakingFeePercentage: 10000,

    getMinimumStakeRequiredForForging(blockHeight){

        if (blockHeight < this.stakingMinimumStakeEffect) return 1 * this.coinDenomination;
        return 1000 * this.coinDenomination;

    },

    _initArgv(parents){
        if (!parents[0].transactions.coins.coinDenomination) throw "invalid coinDenomination";
        this.coinDenomination = parents[0].transactions.coins.coinDenomination;
    }

}