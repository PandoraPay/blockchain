module.exports = {

    coinDenomination: 10000,

    validateCoins(number){

        if (typeof number !== "number") return false;
        if (!Number.isInteger(number) || Number.isNaN(number) ) return false;

        if ( number > Number.MAX_SAFE_INTEGER) return false;
        if ( number < 0) return false;

        return true;
    },

    convertToUnits(number){
        return number * this.coinDenomination;
    },

    convertToBase(number){
        return number / this.coinDenomination;
    }

}