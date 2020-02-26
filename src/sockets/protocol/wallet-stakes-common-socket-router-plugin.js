const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, BufferHelper, StringHelper, Exception} = global.kernel.helpers;

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

        if (!Buffer.isBuffer(publicKey) || publicKey.length !== 33) throw new Exception(this, "public key is invalid", publicKey);
        if (!Buffer.isBuffer(signature) || signature.length !== 65) throw new Exception(this, "signature is invalid", signature);
        if (!Buffer.isBuffer(delegatePublicKey) || delegatePublicKey.length !== 33) throw new Exception(this, "delegatePublicKey is invalid", delegatePublicKey);
        if ( Buffer.isBuffer(delegatePrivateKey) && delegatePrivateKey.length !== 32) throw new Exception(this, "delegatePrivateKey is invalid", delegatePrivateKey);


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

            const delegatorStakePrivateAddress = this._scope.wallet.addresses[0].decryptDelegatorStakePrivateAddress(publicKey);
            if ( !delegatorStakePrivateAddress.publicKey.equals(delegatePublicKey) )
                throw new Exception(this, "You need to set as delegate public key", delegatorStakePrivateAddress.publicKey );

            delegatePrivateKey = delegatorStakePrivateAddress.privateKey;
        }

        const publicKeyHash = this._scope.cryptography.addressGenerator.generatePublicKeyHash( publicKey );
        await this._scope.walletStakes.addWalletStake({publicKeyHash, delegatePublicKey, delegatePrivateKey});

    }

    _listWalletStakes(){

        const delegatedStakes = this._scope.walletStakes.delegatedStakes;
        for (let i=0; i < delegatedStakes.length; i++){

        }

    }

}