const {DBModel} = require('kernel').db;

const {DelegatedStakeDBSchemaBuilt} = require('./delegated-stake-db-schema-build')

module.exports = class DelegatedStakeDBModel extends DBModel {

    constructor(scope, schema = DelegatedStakeDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    checkAmount(){

        //let's check balance

        if (this.amount >= this._scope.argv.transactions.coins.convertToUnits(this._scope.argv.transactions.staking.stakingMinimumStake) )
            return true;

        return false;

    }

    checkStake(){

        return (!this.errorDelegatePrivateKeyChanged) && this.checkAmount();

    }

}