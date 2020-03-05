# Tutorials for Tokens Creation/Printing/Burning

Token **creation** - transaction to create a new token with specific parameters
Token **printing** - transaction to increase the supply of a specific token
Token **burning** - transaction to decrease the supply of a specific token

## Token Creation

```

var create = async () =>{

    const mainAddress = PandoraWallet.$store.state.addresses.list[PandoraWallet.$store.state.wallet.mainAddress]
    if (!mainAddress) throw "Main address was not found";

    const addressWallet = PandoraPay.wallet.manager.getWalletAddressByAddress( mainAddress.address, false );

    const nonce = await PandoraConsensus.downloadNonceIncludingMemPool( mainAddress.address );
    if (nonce === undefined) throw {message: "The connection to the node was dropped"};

    const out = await PandoraPay.wallet.transfer.tokenCreate({
        address: mainAddress.address,
        fee: 1,
        nonce,
        tokenData:{
            version: 0,
            name: "test token",
            description: "token description 1234",
            ticker: "tock",
            maxSupply: 2100000000000000,
            decimalSeparator: 8,
            printerPublicKeyHash: mainAddress.publicKeyHash,
            supply: 0, //it needs to be 0

        },
        memPoolValidateTxData: false,
    });

    console.log(out);

    if (!out) throw "Transaction couldn't be made";

    const outConsensus = await PandoraConsensus._client.emitAsync("mem-pool/new-tx", {tx: out.tx.toBuffer() }, 0);
    if (!outConsensus) throw "Transaction was not included in MemPool";

    await PandoraConsensus.downloadAccountTransactions(mainAddress.address);

    console.log('tokenPublicKeyHash', out.tx.tokenPublicKeyHash.toString('hex') );

    PandoraWallet.$notify({
        type: 'success',
        title: `Token creation transaction was initiated`,
        text: `Token creation transaction was created  \n TxId ${out.tx.hash().toString("hex")}`,
    });

    PandoraWallet.$router.push(`/explorer/tx/hash/${out.tx.hash().toString('hex')}`);

}

create();


```

## Token Printing & Token Burning

```

var changeSupply = async (tokenPublicKeyHash, supplyValue = 10) =>{

    if (!tokenPublicKeyHash) throw "tokenPublicKeyHash argument is missing";

    const mainAddress = PandoraWallet.$store.state.addresses.list[PandoraWallet.$store.state.wallet.mainAddress]
    if (!mainAddress) throw "Main address was not found";

    const addressWallet = PandoraPay.wallet.manager.getWalletAddressByAddress( mainAddress.address, false );

    const nonce = await PandoraConsensus.downloadNonceIncludingMemPool( mainAddress.address );
    if (nonce === undefined) throw {message: "The connection to the node was dropped"};

    const out = await PandoraPay.wallet.transfer.tokenUpdateSupply({
        address: mainAddress.address,
        fee: 1,
        nonce,
        tokenPublicKeyHash,
        supplyValue,
        supplySign: (supplyValue > 0) ? true : false
        memPoolValidateTxData: false,
    });

    console.log(out);

    if (!out) throw "Transaction couldn't be made";

    const outConsensus = await PandoraConsensus._client.emitAsync("mem-pool/new-tx", {tx: out.tx.toBuffer() }, 0);
    if (!outConsensus) throw "Transaction was not included in MemPool";

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


```

## Token Burning