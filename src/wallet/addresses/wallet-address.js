import WalletAddressKeys from "./data/wallet-address-keys";

const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception, BufferHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

const {DBSchemaBuffer, DBSchemaNumber} = global.kernel.marshal.db.samples;
const {DBEncryptedSchema} = global.cryptography.marshal.db.samples;

export default class WalletAddress extends DBSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "address",
                        fixedBytes: 6,
                    },

                    version: {
                        type: "number",
                        fixedBytes: 1,

                        default: 0,

                        validation(version){
                            return version === 0;
                        },

                        position: 100,

                    },

                    name: {
                        type: "string",
                        minSize: 0,
                        maxSize: 255,

                        default: "account",

                        position: 101,
                    },

                    mnemonicSequenceIndex:{
                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 102,
                    },



                    keys: {
                        type: "object",

                        classObject: WalletAddressKeys,
                        position: 103,
                    },


                },

                options: {
                    hashing: {
                        enabled: true,
                        parentHashingPropagation: true,
                        fct: CryptoHelper.dkeccak256,
                    }
                }

            },
            schema, false), data, type, creationOptions);


    }

    get wallet(){
        return this.parent;
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
        return this.keys.private.decryptKey();

    }

    /**
     * extracting public key
     */
    decryptPublicKey(password){

        this.wallet.encryption.decryptWallet(password);
        return this.keys.public.decryptKey();

    }

    /**
     * extracting public key hash
     */
    decryptPublicKeyHash(password){

        const publicKey =  this.decryptPublicKey(password);
        return this._scope.cryptography.addressGenerator.generatePublicKeyHash(publicKey);

    }

    /**
     * Getting Public Address
     */
    decryptZetherPublicAddress( register = false, networkByte , password, ){

        const publicKey =  this.decryptZetherPublicKey( password );
        const registration =  this.decryptZetherRegistration( password );

        const publicAddress = this._scope.cryptography.zetherAddressGenerator.generateZetherAddressFromPublicKey( register ? {
            registered: 1,
            c: registration.toString('hex').slice(0, 64),
            s: registration.toString('hex').slice(64),
        } : undefined, publicKey, networkByte);
        return publicAddress;
    }

    /**
     * extracting zether private
     */
    decryptZetherPrivateKey(password){
        this.wallet.encryption.decryptWallet(password);
        return this.keys.zetherPrivate.decryptKey();
    }

    /**
     * extracting zether public key
     */
    decryptZetherPublicKey(password){
        this.wallet.encryption.decryptWallet(password);
        return this.keys.zetherPublicKey.decryptKey();
    }

    /**
     * extracting zether registration
     */
    decryptZetherRegistration(password){
        this.wallet.encryption.decryptWallet(password);
        return this.keys.zetherRegistration.decryptKey();
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
     * extracting mnemonic sequence index
     */

    decryptMonemonicSequenceIndex(password){

        this.wallet.encryption.decryptWallet(password);
        return this.mnemonicSequenceIndex.decryptKey();
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



}