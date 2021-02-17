const {SocketRouterPlugin} = PandoraLibrary.sockets.protocol;
const {Helper, BufferHelper, StringHelper, Exception} = PandoraLibrary.helpers;
const {CryptoHelper} = PandoraLibrary.helpers.crypto;

module.exports = class WalletStakesCommonSocketRouterPlugin extends  SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._challenge = BufferHelper.generateRandomBuffer( 32 );
    }

    getOneWayRoutes(){

        return {

            "wallet-stakes/is-delegating-open": {
                handle:  this._isDelegatingOpen,
                maxCallsPerSecond:  100,
                descr: "returns a challenge for signature "
            },

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

    async _isDelegatingOpen({publicKeyHash}){

        let alreadyIncluded = false;

        if (this._scope.argv.walletStakes.allowDelegating && publicKeyHash)
            alreadyIncluded = await this._scope.walletStakes.walletStakeAlreadyIncluded( publicKeyHash );

        return {
            allowDelegating: this._scope.argv.walletStakes.allowDelegating,
            minimumFeePercentage: this._scope.argv.walletStakes.minimumFeePercentage,
            maximumDelegates: this._scope.argv.walletStakes.maximumDelegates,
            availableSlots: this._scope.argv.walletStakes.maximumDelegates - this._scope.walletStakes.delegatedStakesList,
            alreadyIncluded,
        }
    }

    _getChallenge(){
        return this._challenge;
    }

    async _importWalletStake({ publicKey, signature, delegateStakePrivateKey }){

        if (!this._scope.argv.walletStakes.allowDelegating)
            throw new Exception(this, "Delegating Stakes is not allowed");

        if (typeof publicKey === "string" && StringHelper.isHex(publicKey)) publicKey = Buffer.from(publicKey, "hex");
        if (typeof signature === "string" && StringHelper.isHex(signature)) signature = Buffer.from(signature, "hex");
        if (typeof delegateStakePrivateKey === "string" && StringHelper.isHex(delegateStakePrivateKey)) delegateStakePrivateKey = Buffer.from(delegateStakePrivateKey, "hex");

        if (!Buffer.isBuffer(publicKey) || publicKey.length !== 33) throw new Exception(this, "public key is invalid", publicKey);
        if (!Buffer.isBuffer(signature) || signature.length !== 65) throw new Exception(this, "signature is invalid", signature);
        if ( delegateStakePrivateKey && (!Buffer.isBuffer(delegateStakePrivateKey) || delegateStakePrivateKey.length !== 32) ) throw new Exception(this, "delegateStakePrivateKey is invalid", delegatePrivateKey);

        const concat = Buffer.concat([
            this._challenge,
            publicKey,
            delegateStakePrivateKey,
        ]);

        const verify = this._scope.cryptography.cryptoSignature.verify( CryptoHelper.dkeccak256(concat), signature, publicKey );
        if (!verify) throw new Exception(this, "Signature is invalid");

        const out = await this._scope.walletStakes.addWalletStake({publicKey, delegateStakePrivateKey});

        return out;

    }

    _listWalletStakes(){

        const out = [];

        const delegatedStakesList = this._scope.walletStakes.delegatedStakesList;
        for (let i=0; i < delegatedStakesList.length; i++){
            out.push({
                publicKeyHash: delegatedStakesList[i].publicKeyHash,
                delegateStakePublicKeyHash: delegatedStakesList[i].delegateStakePublicKeyHash,
            });
        }

        return out;
    }

}