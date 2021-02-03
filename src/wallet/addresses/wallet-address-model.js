const {DBModel} = require('kernel').db;

const {WalletAddressSchemaBuilt} = require( "./wallet-address-schema-build");

module.exports = class WalletAddressModel extends DBModel {

    constructor(scope, schema = WalletAddressSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    get wallet(){
        return this.parent;
    }

    /**
     * extracting mnemonic sequence index
     */

    decryptMnemonicSequenceIndex(password){
        this.wallet.encryption.decryptWallet(password);
        return this.mnemonicSequenceIndex.decryptKey();
    }



}