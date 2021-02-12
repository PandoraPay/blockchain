const coinDenomination = 10000;

module.exports = {

    decimalSeparator: 5,
    coinDenomination: coinDenomination,
    fixedMaxSupply: coinDenomination * 42000000000,

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