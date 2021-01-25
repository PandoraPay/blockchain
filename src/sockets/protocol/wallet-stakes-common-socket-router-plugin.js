const {SocketRouterPlugin} = require('networking').sockets.protocol;
const {Helper, BufferHelper, StringHelper, Exception} = require('kernel').helpers;

module.exports = class WalletStakesCommonSocketRouterPlugin extends  SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._challenge = BufferHelper.generateRandomBuffer( 32 );
    }

    getOneWayRoutes(){

        return {

            "wallet-stakes/challenge": {
                handle:  this._getChallenge,
                maxCallsPerSecond:  100,
                descr: "returns a challenge for signature "
            },

            "wallet-stakes/import-wallet-stake": {
                handle:  this._importWalletStake,
                maxCallsPerSecond:  50,
                descr: "Adds a private key (as returned by dumpprivkey) to your wallet. This may take a while, as a rescan is done, looking for existing transactions "
            },

            "wallet-stakes/list-wallet-stakes": {
                handle: this._listWalletStakes,
                maxCallsPerSecond: 10,
                descr: "Returns a new bitcoin address for receiving payments. If [account] is specified payments received with the address will be credited to [account]. "
            }

        }

    }

    _getChallenge(){
        return this._challenge;
    }

    async _importWalletStake({ publicKey, signature, delegatePublicKey, delegatePrivateKey }){

        if (!this._scope.argv.walletStakes.allowDelegating)
            throw new Exception(this, "Delegating Stakes is not allowed");

        if (typeof publicKey === "string" && StringHelper.isHex(publicKey)) publicKey = Buffer.from(publicKey, "hex");
        if (typeof signature === "string" && StringHelper.isHex(signature)) signature = Buffer.from(signature, "hex");
        if (typeof delegatePublicKey === "string" && StringHelper.isHex(delegatePublicKey)) delegatePublicKey = Buffer.from(delegatePublicKey, "hex");
        if (typeof delegatePrivateKey === "string" && StringHelper.isHex(delegatePrivateKey)) delegatePrivateKey = Buffer.from(delegatePrivateKey, "hex");

        if (!Buffer.isBuffer(publicKey) || publicKey.length !== 33) throw new Exception(this, "public key is invalid", publicKey);
        if (!Buffer.isBuffer(signature) || signature.length !== 65) throw new Exception(this, "signature is invalid", signature);
        if (!Buffer.isBuffer(delegatePublicKey) || delegatePublicKey.length !== 33) throw new Exception(this, "delegatePublicKey is invalid", delegatePublicKey);
        if ( delegatePrivateKey && (!Buffer.isBuffer(delegatePrivateKey) || delegatePrivateKey.length !== 32) ) throw new Exception(this, "delegatePrivateKey is invalid", delegatePrivateKey);

        if (delegatePublicKey.equals(Buffer.alloc(33))){

            if (this._scope.argv.walletStakes.allowDelegatingPrivateKey) throw new Exception(this, "You need to delegate first. Your stake is not delegated");
            else {
                const privateKey = await this._scope.masterCluster.sendMessage("wallet-stakes", {
                    message: "wallet-stakes/get-delegator-stake-private-key",
                    publicKey: publicKey.toString("hex"),
                }, false, true );
                const privateKeyAddress = this._scope.cryptography.addressGenerator.generatePrivateAddressFromPrivateKey(privateKey);
                throw new Exception(this, "You need to delegate your stake to the following public key", privateKeyAddress.publicKey );
            }
        }

        const concat = Buffer.concat([
            this._challenge,
            publicKey,
            delegatePublicKey,
            delegatePrivateKey ? delegatePrivateKey : Buffer.alloc(0),
        ]);

        const verify = this._scope.cryptography.cryptoSignature.verify( concat, signature, publicKey );
        if (!verify) throw new Exception(this, "Signature is invalid");

        if (!this._scope.argv.walletStakes.allowDelegatingPrivateKey) {
            delegatePrivateKey = undefined;
        }

        if ( !delegatePrivateKey ){

            const privateKey = await this._scope.masterCluster.sendMessage("wallet-stakes", {
                message: "wallet-stakes/get-delegator-stake-private-key",
                publicKey: publicKey.toString("hex"),
            }, false, false );

            delegatePrivateKey = privateKey;

        }

        const out = await this._scope.walletStakes.addWalletStake({publicKey, delegatePublicKey, delegatePrivateKey});

        return out;

    }

    _listWalletStakes(){

        const out = [];

        const delegatedStakes = this._scope.walletStakes.delegatedStakes;
        for (let i=0; i < delegatedStakes.length; i++){
            out.push({
                publicKeyHash: delegatedStakes.publicKeyHash,
                delegatePublicKey: delegatedStakes.delegatePublicKey,
            });
        }

        return out;
    }

}