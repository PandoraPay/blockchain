const {DBModel} = PandoraLibrary.db;
const {AccountDataDelegateSchemaBuilt} = require('./account-data-delegate-schema-build')

module.exports = class AccountDataBalanceModel extends DBModel {

    constructor(scope, schema = AccountDataDelegateSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isDataEmpty(){
        if ( !this.delegateNonce && !this.delegatePublicKeyHash.length && !this.delegateFee ) return true;
        return false;
    }
}