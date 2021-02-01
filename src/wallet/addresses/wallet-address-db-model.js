const {DBModel} = require('kernel').db;

const {WalletAddressDBSchemaBuilt} = require( "./wallet-address-db-schema-build");

module.exports = class WalletAddressDBModel extends DBModel {

    constructor(scope, schema = WalletAddressDBSchemaBuilt, data, type , creationOptions){
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