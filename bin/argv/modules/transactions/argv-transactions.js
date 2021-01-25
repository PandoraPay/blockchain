const ArgvCoinbase = require( "./coinbase/argv-coinbase")
const ArgvStaking = require("./staking/argv-staking")
const ArgvCoins = require("./coins/argv-coins")
const ArgvProtocol = require("./protocol/argv-protocol")
const ArgvTokens = require("./tokens/argv-tokens")

module.exports = {


    //10 blocks lockTime for tx
    unlockTime: 10,

    coinbase: ArgvCoinbase,
    coins: ArgvCoins,
    staking: ArgvStaking,
    protocol: ArgvProtocol,
    tokens: ArgvTokens,

}