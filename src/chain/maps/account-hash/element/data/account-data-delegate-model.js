const {DBModel} = PandoraLibrary.db;
const {AccountDataDelegateSchemaBuilt} = require('./account-data-delegate-schema-build')

module.exports = class AccountDataBalanceModel extends DBModel {

    constructor(scope, schema = AccountDataDelegateSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isDataEmpty(){
        if ( !this.delegateStakeNonce && !this.delegateStakePublicKeyHash.length && !this.delegateStakeFee ) return true;
        return false;
    }
}