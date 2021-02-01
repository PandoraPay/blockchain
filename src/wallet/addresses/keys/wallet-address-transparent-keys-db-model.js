const {DBModel} = require('kernel').db;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const {WalletAddressTransparentKeyDBSchemaBuilt} = require('./wallet-address-transparent-keys-db-schema-build')

module.exports = class WalletAddressTransparentKeysDBModel extends DBModel {

    constructor(scope, schema = WalletAddressTransparentKeyDBSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    get wallet(){
        return this.parent.parent;
    }

    /**
     * Getting Public Address
     */
    decryptPublicAddress(networkByte , password, ){

        const publicKey =  this.decryptPublicKey( password );

        const publicAddress = this._scope.cryptography.addressGenerator.generateAddressFromPublicKey( publicKey, networkByte);
        return publicAddress;
    }

    /**
     * extracting private key
     */
    decryptPrivateKey(password){

        this.wallet.encryption.decryptWallet(password);
        return this.private.decryptKey();

    }

    /**
     * extracting public key
     */
    decryptPublicKey(password){

        this.wallet.encryption.decryptWallet(password);
        return this.public.decryptKey();

    }

    /**
     * extracting public key hash
     */
    decryptPublicKeyHash(password){

        const publicKey =  this.decryptPublicKey(password);
        return this._scope.cryptography.addressGenerator.generatePublicKeyHash(publicKey);

    }



    /**
     * extract delegate private key
     */
    decryptDelegateStakePrivateAddress(delegateNonce, password){

        const privateKey = this.decryptPrivateKey(password);
        const privateAddress = this._scope.cryptography.addressGenerator.generatePrivateAddressFromPrivateKey(privateKey);

        return privateAddress.getDelegateStakePrivateAddress(delegateNonce);
    }

    /**
     * Decrypt Delegator Stake private key
     * @param publicKey
     * @param password
     * @returns {*}
     */
    decryptDelegatorStakePrivateAddress(publicKey, password){
        const privateKey = this.decryptPrivateKey(password);
        const privateAddress = this._scope.cryptography.addressGenerator.generatePrivateAddressFromPrivateKey(privateKey);

        return privateAddress.getDelegatorStakePrivateAddress(publicKey);
    }


    /**
     * Sign a message using privateKey
     * @param message
     * @returns {Promise<void>}
     */
    sign(message,  password ){

        const privateKey = this.decryptPrivateKey( password );

        return this._scope.cryptography.cryptoSignature.sign( message, privateKey );

    }

    /**
     * Verify a message using publicKey
     * @param message
     * @param signature
     * @returns {Promise<Promise<*>|PromiseLike<boolean>>}
     */
    verify(message, signature, password ){

        const publicKey = this.decryptPublicKey( password );

        return this._scope.cryptography.cryptoSignature.verify( message, signature, publicKey );

    }

    async decryptBalances(password){
        const publicKeyHash = this.decryptPublicKeyHash(password);
        return this.wallet._scope.mainChain.data.accountHashMap.getBalances( publicKeyHash );
    }

    async decryptBalance(tokenCurrency, password){

        const publicKeyHash = this.decryptPublicKeyHash(password);
        return this.wallet._scope.mainChain.data.accountHashMap.getBalance( publicKeyHash, tokenCurrency );

    }

}