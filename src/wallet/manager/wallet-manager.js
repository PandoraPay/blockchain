const {EncryptedModel} = require('cryptography').models;
const {EncryptedTypeEnum} = require('cryptography').enums;
const {Helper, Exception, BufferHelper} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;
const {AddressModel} = require('cryptography').addresses.public;

const WalletAddressModel = require( "../addresses/wallet-address-model");
const WalletAddressTypeEnum = require( "../addresses/wallet-address-type-enum");


module.exports = class WalletManager{

    constructor(scope){
        this._scope = scope;
    }

    get wallet(){
        return this._scope.wallet;
    }

    getWalletAddressByAddress(address, returnIndex = false, password, networkByte){

        this.wallet.encryption.decryptWallet(password);

        for (let i=0; i < this.wallet.addresses.length; i++){

            const walletAddress = this.wallet.addresses[i];
            const publicAddress = walletAddress.keys.decryptPublicAddress();
            if ( (address instanceof WalletAddressModel && address === walletAddress) || (typeof address === "string" && publicAddress.calculateAddress() === address ) || (address instanceof AddressModel && address.calculateAddress() === publicAddress.calculateAddress() ) )
                return returnIndex ? i : walletAddress;
        }

        return returnIndex ? -1 : null;
    }

    async deleteWalletAddressByAddress(deleteAddress, save, password){

        const index = this.getWalletAddressByAddress(deleteAddress, true);

        return (index !== -1) ? this.deleteWalletAddressByIndex(index, save, true) : false;

    }

    async deleteWalletAddressByIndex(index, save = true, password){

        if (index < 0 || index >= this.wallet.addresses.length) return;

        this.wallet.encryption.decryptWallet();

        const walletAddress = this.wallet.addresses[index];

        walletAddress.delete();

        this.wallet.removeArray( "addresses", index );

        if (save)
            await this.wallet.save();

        return this._scope.events.emit("wallet/address-removed", walletAddress);

    }

    async createMnemonic( save, language ){

        const mnemonic = this._scope.cryptography.addressGenerator.generateMnemonic( language );
        const mnemonicString = mnemonic.join(' ');

        this.wallet.mnemonic = this.wallet._createSimpleModelObject( EncryptedModel, undefined, "mnemonic", {

            encryption: EncryptedTypeEnum.PLAIN_TEXT,
            value: Buffer.from( mnemonicString, "utf8"),

        }, "object" );

        const checksum = CryptoHelper.dkeccak256( Buffer.from( mnemonicString, "utf8" ) );

        this.wallet.mnemonicChecksum = checksum;

        this.wallet.mnemonicSequenceCounter = this.wallet._createSimpleModelObject( EncryptedModel, undefined, "mnemonicSequenceCounter", {

            encryption: EncryptedTypeEnum.PLAIN_TEXT,
            value: Buffer.from( "01", "hex" ), //00 is reservered

        }, "object" );

        if (save) await this.wallet.save();

        return mnemonicString;


    }

    /**
     * No need for Lock
     *
     * @param json
     * @param accountPassword
     * @param password
     * @param save
     * @returns {Promise<*|undefined>}
     */
    async importJSON(json, accountPassword, password, save = true){

        if (accountPassword){ //it is encrypted, let's decrypt

            const walletAddress = this.wallet._createSimpleModelObject(  WalletAddressModel, undefined, "addresses", json, "object");

            if (walletAddress.keys.private.encryption === EncryptedTypeEnum.ENCRYPTED) json.keys.private.value = walletAddress.keys.private.decryptKey( accountPassword );
            if (walletAddress.keys.public.encryption === EncryptedTypeEnum.ENCRYPTED) json.keys.public.value = walletAddress.keys.public.decryptKey( accountPassword );
            if (walletAddress.mnemonicSequenceIndex.encryption === EncryptedTypeEnum.ENCRYPTED) json.mnemonicSequenceIndex.value = walletAddress.mnemonicSequenceIndex.decryptKey(accountPassword);

            if (json.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT ){

            }

        }

        let privateAddress;
        if (json.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT ){

            privateAddress = this._scope.cryptography.addressValidator.validatePrivateAddress( {
                privateKey: json.keys.private.value,
                publicKey: json.keys.public.value,
            } );

        }

        return this.importPrivateKeyAddress(privateAddress, json.type, Number.parseInt( json.mnemonicSequenceIndex.value.toString("hex"), 16 ), password, save )

    }

    async importPrivateKeyAddress( privateKey, type, mnemonicSequenceIndex = 0, password, save){

        let privateAddress;

        if (type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) privateAddress = this._scope.cryptography.addressValidator.validatePrivateAddress(privateKey);
        if (!privateAddress) throw new Exception(this, "Private Key is invalid" );

        //validating mnemonic Sequence Index
        this.wallet.encryption.decryptWallet(password);

        const mnemonic = this.wallet.encryption.decryptMnemonic();

        let privateAddressMnemonic;

        if (type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) privateAddressMnemonic = this._scope.cryptography.addressGenerator.generateAddressFromMnemonic(  mnemonic, mnemonicSequenceIndex ).privateAddress;

        //mnemonic sequence index is not matching, it must be generated from a different mnemonic seed
        if (!privateAddress.privateKey.equals( privateAddressMnemonic.privateKey ))
            mnemonicSequenceIndex = 0;

        const walletAddress = this.wallet._createSimpleModelObject( WalletAddressModel, undefined, "addresses", {

            version: 0,

            type: type,

            name: mnemonicSequenceIndex ? ('Account' +  mnemonicSequenceIndex) : 'New Account',

            mnemonicSequenceIndex:{
                encryption: EncryptedTypeEnum.PLAIN_TEXT,
                value: BufferHelper.convertNumberToBuffer(mnemonicSequenceIndex),
            },

            keys:{

                private:{
                    encryption: EncryptedTypeEnum.PLAIN_TEXT,
                    value: privateAddress.privateKey,
                },
                public:{
                    encryption: EncryptedTypeEnum.PLAIN_TEXT,
                    value: privateAddress.publicKey,
                },

            },

        }, "object");

        return this._pushWalletAddress(walletAddress, save);

    }

    async createNewAddress(type = WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT, password, save = true){

        const mnemonic = this.wallet.encryption.decryptMnemonic();

        let mnemonicSequenceCounter, privateKey;

        if (type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) {
            mnemonicSequenceCounter = this.wallet.encryption.decryptMnemonicSequenceCounter();
            privateKey = this._scope.cryptography.addressGenerator.generateAddressFromMnemonic(  mnemonic, mnemonicSequenceCounter ) ;
        } else throw new Exception(this, "Invalid Type");


        await this.importPrivateKeyAddress( privateKey.privateAddress, type,  mnemonicSequenceCounter, undefined, false );

        let mnemonicSequenceCounterObject;
        if (type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT)
            mnemonicSequenceCounterObject = this.wallet.mnemonicSequenceCounter = this.wallet._createSimpleModelObject( EncryptedModel, undefined, "mnemonicSequenceCounter",{ }, "object" );

        mnemonicSequenceCounterObject.encryption = EncryptedTypeEnum.PLAIN_TEXT;
        mnemonicSequenceCounterObject.value = BufferHelper.convertNumberToBuffer( mnemonicSequenceCounter + 1 );


        if (this.wallet.encrypted) {
            mnemonicSequenceCounterObject.encryptKey(this.wallet.encryption._password);
            mnemonicSequenceCounterObject.decryptKey(this.wallet.encryption._password);
        }

        if (save)
            await this.wallet.save();

        return {
            sequence: privateKey.sequence,
            privateAddress: privateKey.privateAddress,
        }

    }

    _walletAddressAlreadyExists(walletAddress){

        for (const address of this.wallet.addresses) {

            if (address === walletAddress || address.toBuffer().equals(walletAddress.toBuffer())) return address;

            for (const key of ["private", "public"])
                if (walletAddress.keys[key] && address.keys[key]){
                    if (walletAddress.keys[key].encryption === EncryptedTypeEnum.PLAIN_TEXT && address.keys[key].value.equals(walletAddress.keys[key].value)) return address;
                    if (walletAddress.keys[key].encryption === EncryptedTypeEnum.ENCRYPTED && address.keys[key]._unlocked.equals(walletAddress.keys[key].value)) return address;
                }

        }


    }

    async _pushWalletAddress(walletAddress, save = true){

        this.wallet.encryption.decryptWallet();

        const foundWalletAddress = this._walletAddressAlreadyExists(walletAddress);
        if (foundWalletAddress) return false;

        this.wallet.pushArray("addresses", walletAddress);

        if (this.wallet.encrypted) {
            walletAddress.mnemonicSequenceIndex.encryptKey(this.wallet.encryption._password);
            walletAddress.mnemonicSequenceIndex.decryptKey(this.wallet.encryption._password);

            for (const value of ["private", "public"])
                if (walletAddress.keys[value]) {
                    walletAddress.keys[value].encryptKey(this.wallet.encryption._password);
                    walletAddress.keys[value].decryptKey(this.wallet.encryption._password);
                }
        }

        if (save)
            await this.wallet.save();

        this._scope.events.emit("wallet/address-pushed", walletAddress);

        return walletAddress;

    }

    printWallet(){

        for (let i=0; i < this.wallet.addresses.length; i++) {
            this._scope.logger.warn(this, `Wallet ${i} - ${this.wallet.addresses[i].name} `, this.wallet.addresses[i].toJSON());
            if (this.wallet.addresses[i].type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT)
                this._scope.logger.warn(this, `Wallet ${i} - ${this.wallet.addresses[i].name} PublicKeyHash `, this.wallet.addresses[i].keys.decryptPublicKeyHash() );
        }


    }

    async printWalletBalances(){

        for (let i=0; i < this.wallet.addresses.length; i++){

            const balances = await this.wallet.addresses[i].keys.decryptBalances();
            this._scope.logger.warn(this, `Wallet Balance ${i} - ${this.wallet.addresses[i].keys.decryptPublicAddress().calculateAddress() } `, balances === undefined ? 'none' : balances );

        }

    }

}