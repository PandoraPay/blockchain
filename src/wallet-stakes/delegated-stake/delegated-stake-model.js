const {DBModel} = require('kernel').db;

const {DelegatedStakeSchemaBuilt} = require('./delegated-stake-schema-build')

module.exports = class DelegatedStakeModel extends DBModel {

    constructor(scope, schema = DelegatedStakeSchemaBuilt, data, type, creationOptions) {
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