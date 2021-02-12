const {DBModel} = require('kernel').db;
const {AccountDataBalanceSchemaBuilt} = require('./account-data-balance-schema-build')

module.exports = class AccountDataBalanceModel extends DBModel {

    constructor(scope, schema = AccountDataBalanceSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    isBalanceEmpty(){
        return this.amount === 0;
    }

}