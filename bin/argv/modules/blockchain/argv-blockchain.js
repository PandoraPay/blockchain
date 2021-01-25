const ArgvGenesis = require( "./genesis/argv-genesis")

module.exports = {

    maxForkAllowed: 50, // used to solve "Long Range Attacks" for POS. It could be increased later on
    
    genesis: ArgvGenesis,
    
}