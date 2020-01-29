const {Helper, BufferHelper} = global.kernel.helpers;

export default (argv) =>  Helper.merge( argv, {

    blockchain:{
        
        genesisTestNet:{
            
            createNewTestNet: true, //create a new test net
            createNewTestNetGenesisAndWallet: true, //create a new wallet
            
        }
        
    }

} )