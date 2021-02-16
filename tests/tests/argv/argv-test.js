const {Helper, BufferHelper} = PandoraLibrary.helpers;

module.exports = (argv) =>  Helper.merge( argv, {

    testnet:{

        activated: true,
        createNewTestNet: true, //create a new test net
        createNewTestNetGenesisAndWallet: true, //create a new wallet

        argv: {



        },
        
    }

} )