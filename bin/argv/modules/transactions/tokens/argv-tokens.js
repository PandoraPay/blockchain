module.exports = {

    validateCreateTokenFee(burnFee, blockHeight){

        if (burnFee < 10000*this.coinDenomination) return false; // Fee must be considerably high as not everybody is creating his own tokens for doing literally nothing

        return true;
    },

    _initArgv(parents){
        if (!parents[0].transactions.coins.coinDenomination) throw "invalid coinDenomination";
        this.coinDenomination = parents[0].transactions.coins.coinDenomination;
    }

}