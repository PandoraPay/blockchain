const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {DelegatedStakeDBSchemaBuilt} = require('./delegated-stake/delegated-stake-db-schema-build')
const DelegatedStakeDBModel = require('./delegated-stake/delegated-stake-db-model')

class WalletStakesDBSchemaBuild extends DBSchemaBuild{

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
                    schemaBuildClass: DelegatedStakeDBSchemaBuilt,
                    modelClass: DelegatedStakeDBModel,

                    minSize: 0,
                    maxSize: 8190,

                    position: 101,
                },

            }
        }, schema, true));
    }

}

module.exports = {
    WalletStakesDBSchemaBuild,
    WalletStakesDBSchemaBuilt: new WalletStakesDBSchemaBuild()
}