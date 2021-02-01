const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;

const {AccountHashMapDataBalanceSchemaBuilt} = require('./account-hash-map-data-balance-schema-build')

module.exports = class AccountHashMapDataBalanceModel extends HashVirtualMapDBModel {

    constructor(scope, schema = AccountHashMapDataBalanceSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isBalanceEmpty(){
        if (this.amount === 0 ) return true;
        return false;
    }

}