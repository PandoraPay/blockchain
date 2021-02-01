const {SchemaBuild} = require('kernel').marshal;
const {Helper, Exception} = require('kernel').helpers;

class BlockchainTokenUpdateSupplyDataDBSchemaBuild extends SchemaBuild {

    constructor(schema) {

        super(Helper.merge({
            fields: {

                dataVersion:{
                    type: "number",

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 1000,
                },

                tokenPublicKeyHash: {
                    type: "buffer",
                    fixedBytes: 20,

                    position: 1001,
                },

                supplySign: {
                    type: "boolean",

                    position: 1002,
                },

                supplyValue: {
                    type: "number",
                    minSize: 1,

                    position: 1003,
                },

            }
        }, schema, true));

    }

}

module.exports = {
    BlockchainTokenUpdateSupplyDataDBSchemaBuild,
    BlockchainTokenUpdateSupplyDataDBSchemaBuilt: new BlockchainTokenUpdateSupplyDataDBSchemaBuild()
}