import WalletAddress from "./addresses/wallet-address"
import WalletAddressTypeEnum from "./addresses/data/wallet-address-type-enum"
import WalletManager from "./manager/wallet-manager"
import WalletEncryption from "./encryption/wallet-encryption"
import WalletTransfer from "./transfer/wallet-transfer"

const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception} = global.kernel.helpers;

const {DBEncryptedSchema} = global.cryptography.marshal.db.samples;

export default class Wallet extends DBSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "wallet",
                        fixedBytes: 6,
                    },

                    id: {
                        default: "main",
                        fixedBytes: 4,
                    },

                    version: {
                        type: "number",
                        default: 0,

                        validation(value){
                            return value === 0;
                        },

                        position: 100,
                    },

                    encrypted: {

                        type: "boolean",
                        default: false,

                        position: 101,
                    },

                    mnemonic: {

                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 102,
                    },

                    mnemonicChecksum:{
                        type: "buffer",
                        fixedBytes: 32,

                        position: 103,
                    },

                    mnemonicSequenceCounter:{

                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 104,
                    },


                    mnemonicSequenceCounterZether:{

                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 105,
                    },

                    addresses: {
                        type: "array",
                        classObject: WalletAddress,
                        minSize: 0,
                        maxSize: 4095,

                        position: 106,
                    },
                    
                },

                options: {
                    hashing: {
                        enabled: true,
                    }
                }

            },
            schema, false), data, type, creationOptions);

        this._scope.wallet = scope.wallet = this;

        this.encryption = new WalletEncryption( this._scope );

        this.manager = new WalletManager( this._scope );

        this.transfer = new WalletTransfer( this._scope );

    }

    async clearWallet(save = true){

        await this.delete();

        this.addresses = [];
        this.version = 0;
        this.encrypted = false;

        this.encryption.setEncrypted(false);
        this.encryption.setPassword(undefined);
        this.encryption.setIsDecrypted(false);

        await this.manager.createMnemonic(undefined, save);

        if (save)
            await this.save();

    }

    onLoaded(){

        this.encryption.setPassword(undefined);
        this.encryption.setIsDecrypted(false);

    }

    async loadWallet(){

        if (await this.exists())
            await this.load();
        else
            await this.createNewWallet();

        if (this.addresses.length === 0)
            await this.manager.createNewAddress();

        return true;
    }

    async createNewWallet(save = true){

        //create a new mnemonic
        await this.manager.createMnemonic(false,);

        //let's create first address
        await this.manager.createNewAddress( WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT,undefined, save);
        await this.manager.createNewAddress( WalletAddressTypeEnum.WALLET_ADDRESS_ZETHER, undefined, save);

    }

    /**
     * Reset to the first wallet
     * @returns {Promise<void>}
     */
    async resetWallet(){

        for (let i=this.addresses.length-1; i >= 1; i-- )
            this.removeArray("addresses", i);

        await this.save();

    }

    isLoggedIn(){
        if (!this.encrypted) return true;
        return this.encryption._isDecrypted;
    }

}