const {Helper, BufferHelper} = global.protocol.helpers;

export default (argv) =>  Helper.merge( argv, {

    blockchain:{
        
        genesisTestNet:{
            
            createNewTestNet: true, //create a new test net
            createNewTestNetGenesisAndWallet: true, //create a new wallet
            
        }
        
    }

} )