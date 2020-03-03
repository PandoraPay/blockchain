const {Helper, BufferHelper} = global.kernel.helpers;

export default (argv) =>  Helper.merge( argv, {

    testnet:{

        activated: true,
        createNewTestNet: true, //create a new test net
        createNewTestNetGenesisAndWallet: true, //create a new wallet

        argv: {



        },
        
    }

} )