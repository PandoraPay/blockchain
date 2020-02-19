const {DBEncryptedSchema, DBSchemaEncryptionTypeEnum} = global.cryptography.marshal.db.samples;
import WalletAddress from "../addresses/wallet-address";
const {Helper, Exception, BufferHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;
const {Address} = global.cryptography.addresses.public;

export default class WalletManager{

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
            const publicAddress = walletAddress.decryptPublicAddress();
            if ( (address instanceof WalletAddress && address === walletAddress) || (typeof address === "string" && publicAddress.calculateAddress() === address ) || (address instanceof Address && address.calculateAddress() === publicAddress.calculateAddress() ) )
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

        this.wallet.mnemonic = this.wallet._createSimpleObject( DBEncryptedSchema, "mnemonic", {

            encryption: DBSchemaEncryptionTypeEnum.PLAIN_TEXT,
            value: Buffer.from( mnemonicString, "utf8"),

        }, "object" );

        const checksum = CryptoHelper.dkeccak256( Buffer.from( mnemonicString, "utf8" ) );

        this.wallet.mnemonicChecksum = checksum;

        this.wallet.mnemonicSequenceCounter = this.wallet._createSimpleObject( DBEncryptedSchema, "mnemonicSequenceCounter", {

            encryption: DBSchemaEncryptionTypeEnum.PLAIN_TEXT,
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

            const walletAddress = this.wallet._createSimpleObject( WalletAddress, "addresses", json, "object");

            if (walletAddress.keys.private.encryption === DBSchemaEncryptionTypeEnum.ENCRYPTED)
                json.keys.private.value = walletAddress.keys.private.decryptKey( accountPassword );

            if (walletAddress.keys.public.encryption === DBSchemaEncryptionTypeEnum.ENCRYPTED)
                json.keys.public.value = walletAddress.keys.public.decryptKey( accountPassword );

            if (walletAddress.mnemonicSequenceIndex.encryption === DBSchemaEncryptionTypeEnum.ENCRYPTED)
                json.mnemonicSequenceIndex.value = walletAddress.mnemonicSequenceIndex.decryptKey(accountPassword);

        }

        const privateAddress = this._scope.cryptography.addressValidator.validatePrivateAddress( {
            privateKey: json.keys.private.value,
            publicKey: json.keys.public.value,
        } );

        return this.importPrivateKeyAddress(privateAddress, Number.parseInt( json.mnemonicSequenceIndex.value.toString("hex"), 16 ), password, save )

    }

    async importPrivateKeyAddress( privateKey, mnemonicSequenceIndex = 0, password, save){

        const privateAddress = this._scope.cryptography.addressValidator.validatePrivateAddress(privateKey);

        if (!privateAddress) throw new Exception(this, "Private Key is invalid" );

        //validating mnemonic Sequence Index
        this.wallet.encryption.decryptWallet(password);

        const mnemonic = this.wallet.encryption.decryptMnemonic();
        const privateAddressMnemonic = this._scope.cryptography.addressGenerator.generateAddressFromMnemonic(  mnemonic, mnemonicSequenceIndex ).privateAddress;

        //mnemonic sequence index is not matching, it must be generated from a different mnemonic seed
        if (!privateAddress.privateKey.equals( privateAddressMnemonic.privateKey ))
            mnemonicSequenceIndex = 0;

        const walletAddress = this.wallet._createSimpleObject( WalletAddress, "addresses", {

            version: 0,

            name: mnemonicSequenceIndex ? ('Account' +  mnemonicSequenceIndex) : 'New Account',

            mnemonicSequenceIndex:{
                encryption: DBSchemaEncryptionTypeEnum.PLAIN_TEXT,
                value: BufferHelper.convertNumberToBuffer(mnemonicSequenceIndex),
            },

            keys:{

                private:{
                    encryption: DBSchemaEncryptionTypeEnum.PLAIN_TEXT,
                    value: privateAddress.privateKey,
                },
                public:{
                    encryption: DBSchemaEncryptionTypeEnum.PLAIN_TEXT,
                    value: privateAddress.publicKey,
                },

            },

        }, "object");

        return this._pushWalletAddress(walletAddress, save);

    }

    async createNewAddress(password, save = true){

        const mnemonicSequenceCounter = this.wallet.encryption.decryptMnemonicSequenceCounter();
        const mnemonic =  this.wallet.encryption.decryptMnemonic();

        const privateKey = this._scope.cryptography.addressGenerator.generateAddressFromMnemonic(  mnemonic, mnemonicSequenceCounter ) ;

        await this.importPrivateKeyAddress( privateKey.privateAddress,  mnemonicSequenceCounter, undefined, false );

        this.wallet.mnemonicSequenceCounter = this.wallet._createSimpleObject( DBEncryptedSchema, "mnemonicSequenceCounter", {

            encryption: DBSchemaEncryptionTypeEnum.PLAIN_TEXT,
            value: BufferHelper.convertNumberToBuffer( mnemonicSequenceCounter + 1 ),

        }, "object" );

        if (this.wallet.encrypted) {
            this.wallet.mnemonicSequenceCounter.encryptKey(this.wallet.encryption._password);
            this.wallet.mnemonicSequenceCounter.decryptKey(this.wallet.encryption._password);
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

            for (const value of ["private", "public"]) {
                if (walletAddress.keys[value].encryption === DBSchemaEncryptionTypeEnum.PLAIN_TEXT && address.keys[value].value.equals(walletAddress.keys[value].value)) return address;
                if (walletAddress.keys[value].encryption === DBSchemaEncryptionTypeEnum.ENCRYPTED && address.keys[value]._unlocked.equals(walletAddress.keys[value].value)) return address;
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
            walletAddress.keys.private.encryptKey(this.wallet.encryption._password);
            walletAddress.keys.private.decryptKey(this.wallet.encryption._password);
            walletAddress.keys.public.encryptKey(this.wallet.encryption._password);
            walletAddress.keys.public.decryptKey(this.wallet.encryption._password);
        }

        if (save)
            await this.wallet.save();

        this._scope.events.emit("wallet/address-pushed", walletAddress);

        return walletAddress;

    }

    printWallet(){

        for (let i=0; i < this.wallet.addresses.length; i++)
            this._scope.logger.warn(this, `Wallet ${i} - ${this.wallet.addresses[i].name} `, this.wallet.addresses[i].toJSON() );


    }

}