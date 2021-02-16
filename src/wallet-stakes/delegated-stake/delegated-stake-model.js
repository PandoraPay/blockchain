const {DBModel} = PandoraLibrary.db;

const {DelegatedStakeSchemaBuilt} = require('./delegated-stake-schema-build')

module.exports = class DelegatedStakeModel extends DBModel {

    constructor(scope, schema = DelegatedStakeSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    _checkAmount(blockHeight){

        //let's check balance

        if (this.amount >= this._scope.argv.transactions.staking.getMinimumStakeRequiredForForging( blockHeight ) )
            return true;

        return false;

    }

    checkStake(blockHeight){

        return (!this.errorDelegatePrivateKeyChanged) && this._checkAmount(blockHeight);

    }

}