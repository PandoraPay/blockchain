import ArgvGenesis from "./genesis/argv-genesis"
import ArgvGenesisTestNet from "./genesis/argv-genesis-testnet"

export default {

    maxForkAllowed: 750,
    
    genesis: ArgvGenesis,
    genesisTestNet: ArgvGenesisTestNet,
    
}