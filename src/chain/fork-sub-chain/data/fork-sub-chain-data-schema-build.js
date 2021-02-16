const {SubChainDataSchemaBuild} = require('../../sub-chain/data/sub-chain-data-schema-build')
const {Helper, Exception} = PandoraLibrary.helpers;

class ForkSubChainDataSchemaBuild extends SubChainDataSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "fork",
                    minSize: 4,
                    maxSize: 4,
                },

                ready: {
                    type: "boolean",
                    default: false,

                    position: 300,
                },

                processing: {
                    type: "boolean",
                    default: false,

                    position: 301,
                },

                chainwork: {

                    position: 302,

                },

                forkStart: {
                    type: "number",

                    validation(forkStart) {
                        return forkStart >= this.start;
                    },

                    position: 303,
                },

                forkEnd: {
                    type: "number",

                    position: 304,
                },

                timestamp: {

                    type: "number",
                    default() {
                        return this._scope.genesis.settings.getDateNow();
                    },

                    position: 305,

                },


            }

        }, schema, true));

    }

}
module.exports = {
    ForkSubChainDataSchemaBuild,
    ForkSubChainDataSchemaBuilt: new ForkSubChainDataSchemaBuild()
}