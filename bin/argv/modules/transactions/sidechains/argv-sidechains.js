export default {

    coinDenomination: 10000,

    validateMinimumSecurityDeposit( depositLock, blockHeight){

        if (depositLock < 10000 * this.coinDenomination) return false;

        return true;
    },

    validateCreateSidechainFee(burnFee, blockHeight){

        if (burnFee < 1000*this.coinDenomination) return false; // Fee must be quite high

        return true;
    },

}