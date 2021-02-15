module.exports = {

    validateCreateTokenFee(burnFee, blockHeight){

        if (burnFee < 10000*this._coinDenomination) return false; // Fee must be considerably high as not everybody is creating his own tokens for doing literally nothing

        return true;
    },

    _initArgv(parents){
        if (!parents[0].transactions.coins.coinDenomination) throw Error("invalid coinDenomination");
        this._coinDenomination = parents[0].transactions.coins.coinDenomination;
    }

}