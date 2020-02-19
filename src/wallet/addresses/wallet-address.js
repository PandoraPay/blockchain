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
     * Decrypt delegate private key
     */
    decryptDelegatePrivateAddress(delegateNonce, password){

        if (typeof delegateNonce !== "number") throw new Exception(this, "DelegateNonce is missing");

        const privateKey = this.decryptPrivateKey(password);
        const publicKey = this.decryptPublicKey(password);

        let delegateNonceHex = delegateNonce.toString(16);
        if (delegateNonceHex.length % 2 === 1) delegateNonceHex = "0"+delegateNonceHex;

        let delegatePrivateKey = CryptoHelper.dkeccak256( "50524956" + privateKey.toString("hex") + publicKey.toString("hex") + "44454c4547415445" );               //dkeccak256( PRIV + privateKey + publicKey + DELEGATE ) => delegatePrivateKey
        delegatePrivateKey = delegatePrivateKey.toString("hex") + delegateNonceHex;                                                                                 //delegatePrivateKey + delegateNonceHex      => delegatePrivateKey

        delegatePrivateKey = CryptoHelper.dkeccak256(delegatePrivateKey);                                                                                           //dkeccak256( delegatePrivateKey )           => delegatePrivateKey
        delegatePrivateKey = CryptoHelper.dsha256( "5354414b45" + delegatePrivateKey.toString("hex") + "534543524554" );                                            //STAKE + delegatePrivateKey + SECRET        => delegatePrivateKey

        // dsha256( STAKE + dkeccak256( dkeccak256( PRIV + privateKey + publicKey + DELEGATE) + NONCE ) + SECRET )

        const delegatePrivateAddress = this._scope.cryptography.addressGenerator.generatePrivateAddressFromPrivateKey(delegatePrivateKey);

        return delegatePrivateAddress;
    }

    /**
     * extracting public key
     */
    decryptPublicKey(password){

        this.wallet.encryption.decryptWallet(password);

        return this.keys.public.decryptKey();

    }

    /**
     * extracting public key
     */
    decryptPublicKeyHash(password){

        const publicKey =  this.decryptPublicKey(password);

        return this._scope.cryptography.addressGenerator.generatePublicKeyHash(publicKey);

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