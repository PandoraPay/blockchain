const {DBModel} = PandoraLibrary.db;

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

    decryptMnemonicSequenceIndex(){
        this.wallet.encryption.decryptWallet();
        return this.mnemonicSequenceIndex.decryptKey();
    }

    decryptGetDelegateStakePrivateKeyModel( delegateNonce ){
        this.wallet.encryption.decryptWallet();
        const privateKey = this.keys.decryptPrivateKey();
        const privateKeyModel = this._scope.cryptography.addressValidator.validatePrivateKeyAddress( { privateKey, } );

        return privateKeyModel.getDelegateStakePrivateKeyModel(delegateNonce);
    }

}