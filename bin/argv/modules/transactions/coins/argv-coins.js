const decimalSeparator = 5;
const coinDenomination = Math.pow(10,decimalSeparator);
const maxSupplyCoins = 42000000000;

if (maxSupplyCoins * coinDenomination >= Number.MAX_SAFE_INTEGER)
    throw "invalid coin denomination";

module.exports = {

    coinDenomination: coinDenomination,
    decimalSeparator: decimalSeparator,
    fixedMaxSupply_coins: maxSupplyCoins,
    fixedMaxSupply: maxSupplyCoins * coinDenomination,

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