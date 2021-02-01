const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;

const {AccountHashMapDataDelegateSchemaBuilt} = require('./account-hash-map-data-delegate-schema-build')

module.exports = class AccountHashMapDataBalanceModel extends HashVirtualMapDBModel {

    constructor(scope, schema = AccountHashMapDataDelegateSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isDataEmpty(){
        if (this.delegateNonce === 0 && this.delegatePublicKey.equals( Buffer.alloc(33) ) && this.delegateFee === 0 ) return true;
        return false;
    }
}