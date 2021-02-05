module.exports = {

    tokenTicker: "pand",

    getSupplyBefore(blockHeight){

        if (typeof blockHeight !== "number") throw "blockHeight is invalid";

        let sum = 0;

        if ( blockHeight === 0) sum = 1;
        else {

            const  blocksPerCycle = this.blocksPerCycle();
            const  cycle = Math.trunc( blockHeight / blocksPerCycle );

            for (let i=0 ; i < cycle; i++)
                sum += blocksPerCycle * this.getBlockRewardAt( blocksPerCycle * i);

            sum += ( blockHeight % blocksPerCycle ) * this.getBlockRewardAt(blockHeight);

        }

        return sum * this.coinDenomination;

    },

    getBlockRewardAt(blockHeight){

        if (typeof blockHeight !== "number") throw "blockHeight is invalid";


        let reward;
        if (blockHeight === 0)
            reward = 1;
        else {

            const cycle = Math.trunc( blockHeight / this.blocksPerCycle() );

            reward = 4000 / (1 << cycle);

            if (reward < 1)
                reward = 0;

        }

        return reward * this.coinDenomination;
    },

    blocksPerCycle(){
        return 4*365.25*24*60*60 / this._argvBlock.difficulty.blockTime;
    },

    _initArgv( parents ){
        this._argvBlock = parents[0].block;
        if (!parents[0].transactions.coins.coinDenomination) throw "invalid coinDenomination";
        this.coinDenomination = parents[0].transactions.coins.coinDenomination;
    }

}