const {DBModel} = require('kernel').db;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;

const WalletAddressTypeEnum = require("./addresses/wallet-address-type-enum")
const WalletManager = require("./manager/wallet-manager")
const WalletEncryption = require("./encryption/wallet-encryption")
const WalletTransfer = require("./transfer/wallet-transfer")

const {WalletSchemaBuilt} = require('./wallet-schema-build')

module.exports = class WalletModel extends DBModel {

    constructor(scope, schema = WalletSchemaBuilt, data, type , creationOptions){

        super(scope, schema, data, type, creationOptions);

        this._scope.wallet = scope.wallet = this;

        this.encryption = new WalletEncryption( this._scope );

        this.manager = new WalletManager( this._scope );

        this.transfer = new WalletTransfer( this._scope );

    }

    async initializeWallet(){


        this._scope.mainChain.on("blocks/included", async ({end})=>{

            if (this._scope.argv.wallet.printWalletBalances)
                this.manager.printWalletBalances();

        });

        return true;

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