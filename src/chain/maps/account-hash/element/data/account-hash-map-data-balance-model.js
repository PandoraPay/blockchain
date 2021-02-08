const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;

const {AccountHashMapDataBalanceSchemaBuilt} = require('./account-hash-map-data-balance-schema-build')

module.exports = class AccountHashMapDataBalanceModel extends HashVirtualMapModel {

    constructor(scope, schema = AccountHashMapDataBalanceSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isBalanceEmpty(){
        return this.amount === 0;
    }

}