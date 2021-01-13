export default {

    coinDenomination: 10000,

    validateCreateTokenFee(burnFee, blockHeight){

        if (burnFee < 10000*this.coinDenomination) return false; // Fee must be considerably high as not everybody is creating his own tokens for doing literally nothing

        return true;
    },

}