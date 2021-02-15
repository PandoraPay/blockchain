module.exports = {


    getBlockRewardAt(blockHeight, circulatingSupply){

        if (typeof blockHeight !== "number") throw Error("blockHeight is invalid");
        if (typeof circulatingSupply !== "number" ) throw Error("circulatingSupply is invalid");
        if ( circulatingSupply < 0 ) throw Error("circulatingSupply is negative")
        if ( circulatingSupply === 0 && blockHeight > 0) throw Error("circulatingSupply was not set")

        if (circulatingSupply >= this._fixedMaxSupply ) return 0; //making sure the coin supply is fixed

        let reward;
        if (blockHeight === 0)
            reward = 1;
        else {

            const cycle = Math.trunc( blockHeight / this.blocksPerCycle() );

            reward = 4000 / (1 << cycle);

            if (reward < 1)
                reward = 0;

        }

        return reward * this._coinDenomination;
    },

    blocksPerCycle(){
        return 4*365.25*24*60*60 / this._argvBlock.difficulty._blockTime;
    },

    _initArgv( parents ){
        this.blockTime =
        this._argvBlock = parents[0].block;

        if (!parents[0].transactions.coins.coinDenomination) throw Error("invalid coinDenomination");
        this._coinDenomination = parents[0].transactions.coins.coinDenomination;
        this._fixedMaxSupply = parents[0].transactions.coins.fixedMaxSupply;
    }

}