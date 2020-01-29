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
--settings:networkType 1 --blockchain:genesisTestNet:createNewTestNet true --wallet:printWallet true --forging:enabled true
```

Run CLI command

```
node start-node.js --masterCluster:serverCluster:httpServer:port 4005 --blockchain:genesisTestNet:createNewTestNet true --wallet:printWallet true --settings:networkType 1 --forging:start true
```

1. Import your node private into the wallet.
2. Generate the Public Key Hash
3. Ovewrite genesis test net public key hash in `argv-genesis-testnet.js` >> `stakes.publicKeyHash`


To do

1. Don't accept forks with more than 100 blocks
2.