const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;

const {AccountHashMapDataDelegateSchemaBuilt} = require('./account-hash-map-data-delegate-schema-build')

module.exports = class AccountHashMapDataBalanceModel extends HashVirtualMapModel {

    constructor(scope, schema = AccountHashMapDataDelegateSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isDataEmpty(){
        if (this.delegateNonce === 0 && !this.delegatePublicKeyHash.length && this.delegateFee === 0 ) return true;
        return false;
    }
}