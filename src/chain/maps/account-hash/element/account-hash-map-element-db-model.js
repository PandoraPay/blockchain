const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;

const {AccountHashMapElementDBSchemaBuilt} = require('./account-hash-map-element-db-schema-build')

module.exports = class AccountHashMapElementDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = AccountHashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isDataEmpty(){

        if (this.balances.length === 0 && this.nonce === 0 && this.delegate.isDataEmpty() ) return true;

        return false;
    }

}