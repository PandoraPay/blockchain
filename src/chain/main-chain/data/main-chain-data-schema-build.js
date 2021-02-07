const {BaseChainDataSchemaBuild} = require( "../../base/base-chain-data-schema-build");
const {Helper} = require('kernel').helpers;

class MainChainDataSchemaBuild extends BaseChainDataSchemaBuild {

    constructor(schema) {

        super(Helper.merge( {

                fields:{

                    table: {
                        default: "mainchain",
                        minSize: 9,
                        maxSize: 9,
                    },

                    id: {
                        default: "main",
                        minSize: 4,
                        maxSize: 4,
                    },

                    version: {
                        default: 0,
                    },

                    beingSaved:{
                        type: "boolean",
                        default: false,
                        position: 1000,
                    }

                }

            },
            schema, true ));
    }
}

module.exports = {
    MainChainDataSchemaBuild,
    MainChainDataSchemaBuilt: new MainChainDataSchemaBuild(),
}