const {EncryptedTypeEnum} = require('cryptography').enums;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class WalletEncryption {

    constructor(scope) {
        this._scope = scope;

        this._isDecrypted = false;
        this._password = undefined;

    }

    get wallet() {
        return this._scope.wallet;
    }

    decryptWallet(password, askPassword = true ){

        if ( !this.wallet.encrypted ) return true;
        if (this._isDecrypted) return true;

        if (this.wallet.mnemonic.encryption === EncryptedTypeEnum.NON_EXISTENT ) throw new Exception(this, "Mnemonic is missing");

        if ( !Buffer.isBuffer(password) || password.length !== 32 ){

            if (!askPassword) throw new Exception(this, "Ask Password is set false");

            password = this._scope.cli.askInput('Enter your password', );

        }

        const mnemonicBuff = this.wallet.mnemonic.decryptKey(password);
        const mnemonic = mnemonicBuff.toString("utf8");

        if ( !this._scope.cryptography.addressGenerator.bip39.validateMnemonic( mnemonic ) ) throw new Exception(this, "Password is invalid" );

        this._operate( it => it.decryptKey( password ) );

        this.setPassword(password);
        this.setIsDecrypted(true);

        return true;
    }

    async encryptWallet(oldPassword, newPassword){

        if ( this.wallet.encrypted ) this.decryptWallet( oldPassword );

        if (!newPassword) throw new Exception(this, "Password is not set");

        this._operate( it => it.encryptKey( newPassword ) );

        this.setEncrypted(true);
        this.setPassword(undefined);
        this.setIsDecrypted(false);

        this.decryptWallet(newPassword);

        this._scope.events.emit("wallet/encrypted", this.wallet.encrypted);

        await this.wallet.save();

        return true;
    }

    async removeEncryptionWallet(oldPassword){

        this.decryptWallet( oldPassword );

        if (this._password !== oldPassword) throw new Exception(this, "Old password is not matching");

        this._operate( async it => {
            it.removeEncryptionKey( this._password );
            delete it._unlocked;
        } );

        this.setEncrypted(false);
        this.setPassword(undefined);
        this.setIsDecrypted(false);

        await this.wallet.save();

        return true;
    }

    logoutEncryptionWallet(){

        if (!this.wallet.encrypted) return true;

        this._operate( it => delete it._unlocked );

        this.setPassword(undefined);
        this.setIsDecrypted(false);

        return true;
    }

    _operate( callback ){

        const list = [
            this.wallet.mnemonic,
            this.wallet.mnemonicSequenceCounter,
        ];

        for (let i=0; i < this.wallet.addresses.length; i++) {
            list.push( this.wallet.addresses[i].mnemonicSequenceIndex );
            list.push( this.wallet.addresses[i].keys.private );
            list.push( this.wallet.addresses[i].keys.public );

            if (this.wallet.addresses[i].keys.registration)
                list.push( this.wallet.addresses[i].keys.registration );
        }

        return list.map ( callback );
    }


    decryptMnemonic(password){

        this.decryptWallet(password);

        const mnemonic = this.wallet.mnemonic.decryptKey();
        return  mnemonic.toString("utf8").split(' ');

    }

    decryptMnemonicSequenceCounter(password){

        this.decryptWallet(password);

        const mnemonicSequenceCounter = this.wallet.mnemonicSequenceCounter.decryptKey();
        return parseInt( mnemonicSequenceCounter.toString("hex"), 16);

    }

    setEncrypted(newValue){
        this.wallet.encrypted = newValue;
        return this._scope.events.emit("wallet/encrypted", newValue);
    }

    setIsDecrypted(newValue){
        this._isDecrypted = newValue;
        return this._scope.events.emit("wallet/loggedIn", this.wallet.isLoggedIn() );
    }

    setPassword(newValue){
        this._password = newValue;
    }

    checkPassword(password){

        if (!this.wallet.encrypted) return true;
        if (!this._isDecrypted)
            this.decryptWallet(password);


        if (!this._isDecrypted) return false;

        if (password === this._password) return true;
        else return false;

    }

    checkIfIsReallyEncrypted(encrypted){
        const map = this._operate( it => it.encryption === (encrypted ? EncryptedTypeEnum.ENCRYPTED : EncryptedTypeEnum.PLAIN_TEXT) );
        return map.reduce( (res, it) => res && it, true )
    }

}