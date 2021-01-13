import ArgvCoinbase from "./coinbase/argv-coinbase"
import ArgvStaking from "./staking/argv-staking"
import ArgvCoins from "./coins/argv-coins"
import ArgvProtocol from "./protocol/argv-protocol"
import ArgvTokens from "./tokens/argv-tokens"

export default {


    //10 blocks lockTime for tx
    unlockTime: 10,

    coinbase: ArgvCoinbase,
    coins: ArgvCoins,
    staking: ArgvStaking,
    protocol: ArgvProtocol,
    tokens: ArgvTokens,

}