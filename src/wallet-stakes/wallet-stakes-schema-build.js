const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {DelegatedStakeSchemaBuilt} = require('./delegated-stake/delegated-stake-schema-build')
const DelegatedStakeModel = require('./delegated-stake/delegated-stake-model')

class WalletStakesSchemaBuild extends DBSchemaBuild{

    constructor(schema) {

        super(Helper.merge({

            fields: {

                version: {
                    type: "number",
                    default: 0,
                    validation(value){
                        return value === 0;
                    },
                    position: 100,
                },

                delegatedStakesStored: {
                    type: "array",
                    schemaBuiltClass: DelegatedStakeSchemaBuilt,
                    modelClass: DelegatedStakeModel,

                    minSize: 0,
                    maxSize: 8190,

                    position: 101,
                },

            }
        }, schema, true));
    }

}

module.exports = {
    WalletStakesSchemaBuild,
    WalletStakesSchemaBuilt: new WalletStakesSchemaBuild()
}