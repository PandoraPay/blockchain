const {EncryptedModel} = PandoraLibrary.models;
const {EncryptedTypeEnum} = PandoraLibrary.enums;
const {Helper, Exception, BufferHelper, StringHelper} = PandoraLibrary.helpers;
const {CryptoHelper} = PandoraLibrary.helpers.crypto;
const {AddressModel} = PandoraLibrary.addresses.address;

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
            const publicAddress = walletAddress.keys.decryptAddress();
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

        let privateKeyModel;
        if (json.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT ){

            privateKeyModel = this._scope.cryptography.addressValidator.validatePrivateKeyAddress( {
                privateKey: json.keys.private.value,
                publicKey: json.keys.public.value,
            } );

        }

        return this.importPrivateKeyModel(privateKeyModel, json.type, Number.parseInt( json.mnemonicSequenceIndex.value.toString("hex"), 16 ), password, save )

    }

    async importPrivateKeyModel( privateKeyModel, type, mnemonicSequenceIndex = 0, password, save){

        if (type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) privateKeyModel = this._scope.cryptography.addressValidator.validatePrivateKeyAddress(privateKeyModel);
        if (!privateKeyModel) throw new Exception(this, "Private Key is invalid" );

        //validating mnemonic Sequence Index
        this.wallet.encryption.decryptWallet(password);

        const mnemonic = this.wallet.encryption.decryptMnemonic();

        let privateKeyModelFromMnemonic;

        if (type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) privateKeyModelFromMnemonic = this._scope.cryptography.addressGenerator.generatePrivateKeyFromMnemonic(  mnemonic, mnemonicSequenceIndex ).privateKeyModel;

        //mnemonic sequence index is not matching, it must be generated from a different mnemonic seed
        if (!privateKeyModel.privateKey.equals( privateKeyModelFromMnemonic.privateKey ))
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
                    value: privateKeyModel.privateKey,
                },
                public:{
                    encryption: EncryptedTypeEnum.PLAIN_TEXT,
                    value: privateKeyModel.publicKey,
                },

            },

        }, "object");

        return this._pushWalletAddress(walletAddress, save);

    }

    async createNewAddress(type = WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT, password, save = true){

        const mnemonic = this.wallet.encryption.decryptMnemonic();

        let mnemonicSequenceCounter, privateKeyInfo;

        if (type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) {
            mnemonicSequenceCounter = this.wallet.encryption.decryptMnemonicSequenceCounter();
            privateKeyInfo = this._scope.cryptography.addressGenerator.generatePrivateKeyFromMnemonic(  mnemonic, mnemonicSequenceCounter ) ;
        } else throw new Exception(this, "Invalid Type");


        await this.importPrivateKeyModel( privateKeyInfo.privateKeyModel, type,  mnemonicSequenceCounter, undefined, false );

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
            sequence: privateKeyInfo.sequence,
            privateKeyModel: privateKeyInfo.privateKeyModel,
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

        let i = -1;
        for (const walletAddress of this.wallet.addresses) {
            i++;
            this._scope.logger.warn(this, `Wallet ${i} - ${walletAddress.name} `, walletAddress.toJSON());
            if (walletAddress.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT)
                this._scope.logger.warn(this, `Wallet ${i} - ${walletAddress.name} PublicKeyHash `, walletAddress.keys.decryptPublicKeyHash() );
        }


    }

    printWalletBalances(){
        let i = -1;
        for (const walletAddress of this.wallet.addresses) {
            i++;
            const balances = walletAddress.keys.decryptBalances();
            this._scope.logger.warn(this, `Wallet Balance ${i} - ${walletAddress.keys.decryptAddress().calculateAddress() } `, balances === undefined ? 'none' : balances );
        }
    }

    async decryptTxExtra(tx, returnString = true, password){

        if (!tx.extra.length) return;

        if (tx.extra[0] === 0) return tx.extra.toString().slice(1);
        else if (tx.extra[0] === 1)
            for (const vout of tx.vout)
                if (vout.publicKeyHash)
                    for (const walletAddress of this.wallet.addresses) {
                        const publicKeyHash = walletAddress.keys.decryptPublicKeyHash(password);
                        if (publicKeyHash.equals( vout.publicKeyHash) ) {

                            const extra = Buffer.alloc(tx.extra.length-1);
                            tx.extra.copy(extra, 0, 1, tx.extra.length );

                            const decrypted = await walletAddress.keys.decryptExtraEncryptedMessage(extra, password);
                            if (decrypted) return returnString ? StringHelper.sanitizeText(decrypted.toString()) : decrypted;
                        }
                    }

    }

}