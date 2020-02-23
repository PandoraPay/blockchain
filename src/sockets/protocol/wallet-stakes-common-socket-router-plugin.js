const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, BufferHelper, StringHelper} = global.kernel.helpers;

export default class WalletStakesCommonSocketRouterPlugin extends  SocketRouterPlugin {

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

        if (typeof publicKey === "string" && StringHelper.isHex(publicKey)) publicKey = Buffer.from(publicKey, "hex");
        if (typeof signature === "string" && StringHelper.isHex(signature)) signature = Buffer.from(signature, "hex");
        if (typeof delegatePublicKey === "string" && StringHelper.isHex(delegatePublicKey)) delegatePublicKey = Buffer.from(delegatePublicKey, "hex");
        if (typeof delegatePrivateKey === "string" && StringHelper.isHex(delegatePrivateKey)) delegatePrivateKey = Buffer.from(delegatePrivateKey, "hex");

        if (!Buffer.isBuffer(publicKey) || publicKey.length !== 33) throw "public key is invalid";
        if (!Buffer.isBuffer(signature) || signature.length !== 64) throw "signature is invalid";
        if (!Buffer.isBuffer(delegatePublicKey) || delegatePublicKey.length !== 64) throw "delegatePublicKey is invalid";
        if (!Buffer.isBuffer(delegatePrivateKey) || delegatePrivateKey.length !== 64) throw "delegatePrivateKey is invalid";

        const concat = Buffer.concat([
            publicKey,
            delegatePublicKey,
            delegatePrivateKey,
            this._challenge,
        ]);

        const verify = this._scope.cryptography.cryptoSignature.verify( concat, signature, publicKey );
        if (!verify) throw "Signature is invalid";

        const publicKeyHash = this._scope.cryptography.addressGenerator.generatePublicKeyHash( publicKey );
        await this._scope.walletStakes.addWalletStake({publicKeyHash, delegatePublicKey, delegatePrivateKey});

    }

    _listWalletStakes(){

        const delegatedStakes = this._scope.walletStakes.delegatedStakes;
        for (let i=0; i < delegatedStakes.length; i++){

        }

    }

}