##### Specify port

```
--masterCluster:serverCluster:httpServer:port 4005
```

##### Connect to test net

```
--settings:networkType 1
```

##### Start staking

```
--forging:start true
```

##### Deploy your own test net

To deploy your own test net, you need to configure a new test net and start forging as the staking genesis transaction will be set randomly to you.

Node parameters to set up a testnet network
```
testnet:activated true --testnet:createNewTestNet true --wallet:printWallet true --wallet:printWalletBalance true --forging:start true --dbPublic:redisDB:differentDatabase true --walletStakes:deleteWalletStakes true
```

Run CLI command

```
node start-node.js --masterCluster:serverCluster:httpServer:port 8083 --testnet:activated true --testnet:createNewTestNet --wallet:printWalletBalance true true --wallet:printWallet true --forging:start true --dbPublic:redisDB:differentDatabase true --walletStakes:deleteWalletStakes true
```

1. Import your node private into the wallet.
2. Generate the Public Key Hash
3. Ovewrite genesis test net public key hash in `argv-genesis-testnet.js` >> `stakes.publicKeyHash`


To do

1. Don't accept forks with more than 100 blocks
2.