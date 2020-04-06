const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;
const {DBEncryptedSchema} = global.cryptography.marshal.db.samples;

export default class WalletAddressZetherKeys extends DBSchema{

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

                    private:{
                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 101,
                    },

                    public:{
                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 102,
                    },

                    registration:{
                        type: "object",
                        classObject: DBEncryptedSchema,

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
        return this.parent.parent;
    }

    /**
     * Getting Public Address
     */
    decryptPublicAddress( register = false, networkByte , password, ){

        const publicKey =  this.decryptPublicKey( password );
        const registration =  this.decryptRegistration( password );

        const publicAddress = this._scope.cryptography.zetherAddressGenerator.generateAddressFromPublicKey( publicKey, register ? registration : undefined, networkByte);
        return publicAddress;
    }

    /**
     * extracting zether private
     */
    decryptPrivateKey(password){
        this.wallet.encryption.decryptWallet(password);
        return this.private.decryptKey();
    }

    /**
     * extracting zether public key
     */
    decryptPublicKey(password){
        this.wallet.encryption.decryptWallet(password);
        return this.public.decryptKey();
    }

    /**
     * extracting zether registration
     */
    decryptRegistration(password){
        this.wallet.encryption.decryptWallet(password);
        const registration = this.registration.decryptKey();
        return {
            c: Buffer.from( registration.toString('hex').slice(0, 64), "hex"),
            s: Buffer.from( registration.toString('hex').slice(64), "hex"),
        }
    }

    async decryptBalances(password){

        const publicKey = this.decryptPublicKey(password);
        const privateKey = this.decryptPrivateKey(password);

        return this._scope.mainChain.zsc.getBalances(publicKey, privateKey);
    }

    async decryptBalance(tokenCurrency, password){
        const publicKey = this.decryptPublicKey(password);
        const privateKey = this.decryptPrivateKey(password);

        return this._scope.mainChain.zsc.getBalances(publicKey, privateKey, tokenCurrency);
    }

}