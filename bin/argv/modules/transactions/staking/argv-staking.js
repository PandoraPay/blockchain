module.exports = {

    stakingMinimumStakeEffectBlockHeight: 100, // to avoid forks

    stakingGrindingLockedTransfersBlocks: 50, // Used to solve "Stake Griding Attack Vector" for POS by locking the funds sent from transactions

    delegateStakingFeePercentage: 10000,

    getMinimumStakeRequiredForForging(blockHeight){

        if (blockHeight < this.stakingMinimumStakeEffectBlockHeight) return 1 * this._coinDenomination;
        return 1000 * this._coinDenomination;

    },

    _initArgv(parents){
        if (!parents[0].transactions.coins.coinDenomination) throw "invalid coinDenomination";
        this._coinDenomination = parents[0].transactions.coins.coinDenomination;
    }

}