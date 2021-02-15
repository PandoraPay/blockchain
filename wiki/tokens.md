# Tutorials for Tokens Creation/Printing/Burning

Token **creation** - transaction to create a new token with specific parameters
Token **printing** - transaction to increase the supply of a specific token
Token **burning** - transaction to decrease the supply of a specific token

## Token Creation

```

var createToken = async (name, description, ticker, maxSupply, decimalSeparator) =>{

    const mainAddress = PandoraWallet.$store.state.addresses.list[PandoraWallet.$store.state.wallet.mainAddress]
    if (!mainAddress) throw Error("Main address was not found");

    const addressWallet = PandoraPay.wallet.manager.getWalletAddressByAddress( mainAddress.address, false );

    const nonce = await PandoraConsensus.downloadNonceIncludingMemPool( mainAddress.address );
    if (nonce === undefined) throw {message: "The connection to the node was dropped"};

    const out = await PandoraPay.wallet.transfer.tokenCreate({
        address: mainAddress.address,
        fee: 1,
        nonce,
        tokenData:{
            version: 0,
            name,
            description,
            ticker,
            maxSupply,
            decimalSeparator,
            verificationPublicKey: mainAddress.publicKeyHash,
            supply: 0, //it needs to be 0

        },
        memPoolValidateTxData: false,
    });

    console.log(out);

    if (!out) throw Error("Transaction couldn't be made");

    const outConsensus = await PandoraConsensus._client.emitAsync("mem-pool/new-tx", {tx: out.tx.toBuffer() }, 0);
    if (!outConsensus) throw Error("Transaction was not included in MemPool");

    await PandoraConsensus.downloadAccountTransactions(mainAddress.address);

    console.log('tokenPublicKeyHash', out.tx.tokenPublicKeyHash.toString('hex') );

    PandoraWallet.$notify({
        type: 'success',
        title: `Token creation transaction was initiated`,
        text: `Token creation transaction was created  \n TxId ${out.tx.hash().toString("hex")}`,
    });

    PandoraWallet.$router.push(`/explorer/tx/hash/${out.tx.hash().toString('hex')}`);

}

createToken("Test Token", "token description 1234", "TOCK", 2100000000000000, 8 );
createToken("TOKEN X", "token2 description 1234", "TOCKX", 2100000000000000, 8 );


```

## Token Printing & Token Burning

```

var changeSupply = async (tokenPublicKeyHash, supplyValue = 10) =>{

    if (!tokenPublicKeyHash) throw Error("tokenPublicKeyHash argument is missing");

    const mainAddress = PandoraWallet.$store.state.addresses.list[PandoraWallet.$store.state.wallet.mainAddress]
    if (!mainAddress) throw Error("Main address was not found");

    const addressWallet = PandoraPay.wallet.manager.getWalletAddressByAddress( mainAddress.address, false );

    const nonce = await PandoraConsensus.downloadNonceIncludingMemPool( mainAddress.address );
    if (nonce === undefined) throw {message: "The connection to the node was dropped"};

    const out = await PandoraPay.wallet.transfer.tokenUpdateSupply({
        address: mainAddress.address,
        fee: 1,
        nonce,
        tokenPublicKeyHash,
        supplyValue: Math.abs(supplyValue),
        supplySign: (supplyValue > 0) ? true : false,
        memPoolValidateTxData: false,
    });

    console.log(out);

    if (!out) throw Error("Transaction couldn't be made");

    const outConsensus = await PandoraConsensus._client.emitAsync("mem-pool/new-tx", {tx: out.tx.toBuffer() }, 0);
    if (!outConsensus) throw Error("Transaction was not included in MemPool");

    await PandoraConsensus.downloadAccountTransactions(mainAddress.address);

    PandoraWallet.$notify({
        type: 'success',
        title: `Token creation transaction was initiated`,
        text: `Token creation transaction was created  \n TxId ${out.tx.hash().toString("hex")}`,
    });

    PandoraWallet.$router.push(`/explorer/tx/hash/${out.tx.hash().toString('hex')}`);

}

// printing new coins
changeSupply("1aff02668474c307133739d466d58c9e577f2e9c", 10);

// burning coins from my own balance
changeSupply("1aff02668474c307133739d466d58c9e577f2e9c", -5);


changeSupply("74a57d94e9857ed9c36de26b4954553e0d8c6408", 80);


```

## Token Burning