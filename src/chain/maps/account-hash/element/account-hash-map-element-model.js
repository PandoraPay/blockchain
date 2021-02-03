const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;

const {AccountHashMapElementSchemaBuilt} = require('./account-hash-map-element-schema-build')

module.exports = class AccountHashMapElementModel extends HashVirtualMapModel {

    constructor(scope, schema = AccountHashMapElementSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isDataEmpty(){

        if (this.balances.length === 0 && this.nonce === 0 && this.delegate.isDataEmpty() ) return true;

        return false;
    }

}