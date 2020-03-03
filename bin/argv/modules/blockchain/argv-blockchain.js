import ArgvGenesis from "./genesis/argv-genesis"

export default {

    maxForkAllowed: 50, // used to solve "Long Range Attacks" for POS. It could be increased later on
    
    genesis: ArgvGenesis,
    
}