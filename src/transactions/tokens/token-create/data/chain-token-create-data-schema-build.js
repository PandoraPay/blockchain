const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception} = require('kernel').helpers;

const {TokenDataSchemaBuild} = require('../../../../chain/maps/tokens/tokens-hash/data/token-data-schema-build')

class ChainTokenCreateDataSchemaBuild extends TokenDataSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                dataVersion:{
                    type: "number",

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 100,
                },

            },

            options:{
                hashing:{
                    fct: a => a,
                }
            }

        }, schema, true) );

    }

}

module.exports = {
    ChainTokenCreateDataSchemaBuild,
    ChainTokenCreateDataSchemaBuilt: new ChainTokenCreateDataSchemaBuild()
}