module.exports = {

    coinDenomination : 10000,

    stakingMinimumStake: 1000, //coins
    stakingMinimumStakeEffect: 100,

    stakingGrindingLockedTransfersBlocks: 50, // Used to solve "Stake Griding Attack Vector" for POS by locking the funds sent from transactions

    delegateStakingFeePercentage: 10000,

    getMinimumStakeRequiredForForging(blockHeight){

        if (blockHeight < this.stakingMinimumStakeEffect) return 1 * this.coinDenomination;

        return this.stakingMinimumStake * this.coinDenomination;

    }

}