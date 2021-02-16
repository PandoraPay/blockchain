const {DBModel} = PandoraLibrary.db;
const {AccountHashMapElementSchemaBuilt} = require('./account-hash-map-element-schema-build')

module.exports = class AccountHashMapElementModel extends DBModel {

    constructor(scope, schema = AccountHashMapElementSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isDataEmpty(){
        if ( !this.balances.length && !this.nonce && this.delegate.isDataEmpty() ) return true;
        return false;
    }

}