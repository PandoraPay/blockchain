const {DBModel} = require('kernel').db;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const {WalletAddressTransparentKeySchemaBuilt} = require('./wallet-address-transparent-keys-schema-build')

module.exports = class WalletAddressTransparentKeysModel extends DBModel {

    constructor(scope, schema = WalletAddressTransparentKeySchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    get wallet(){
        return this.parent.parent;
    }

    /**
     * Getting Public Address
     */
    decryptAddress(networkByte , password, ){
        const publicKey =  this.decryptPublicKey( password );
        return this._scope.cryptography.addressGenerator.generateAddressFromPublicKey( publicKey, networkByte);
    }

    /**
     * Getting Public Address
     */
    decryptAddressPublicKey( networkByte , password, ){
        const publicKey =  this.decryptPublicKey( password );
        return this._scope.cryptography.addressGenerator.generateAddressPublicKeyFromPublicKey( publicKey, networkByte);
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

    decryptBalances(password){
        const publicKeyHash = this.decryptPublicKeyHash(password);
        return this.wallet._scope.mainChain.data.accountHashMap.getBalances( publicKeyHash );
    }

    decryptBalance(tokenCurrency, password){
        const publicKeyHash = this.decryptPublicKeyHash(password);
        return this.wallet._scope.mainChain.data.accountHashMap.getBalance( publicKeyHash, tokenCurrency );
    }

    async decryptExtraEncryptedMessage(message, password){
        const privateKey = this.decryptPrivateKey( password );
        return this._scope.cryptography.cryptoSignature.decrypt( message, privateKey );
    }

}