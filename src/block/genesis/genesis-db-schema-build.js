const {BlockDBSchemaBuild} = require('./../block-db-schema-build')
const {Helper} = require('kernel').helpers;

class GenesisDBSchemaBuild extends BlockDBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                height: {
                    default: 0,
                    validation(height) {
                        return height === 0;
                    }
                },

                prevHash: {
                    default(){
                        return this._scope.genesis.settings.prevHash;
                    },
                    validation(prevHash) {
                        return prevHash.equals( this._scope.genesis.settings.prevHash );
                    }
                },

                prevKernelHash: {
                    default(){
                        return this._scope.genesis.settings.prevKernelHash;
                    },
                    validation(prevKernelHash) {
                        return prevKernelHash.equals( this._scope.genesis.settings.prevKernelHash );
                    }
                },

                target: {
                    default(){
                        return this._scope.genesis.settings.target;
                    },
                    validation(target) {
                        return target.equals( this._scope.genesis.settings.target );
                    }
                },

                timestamp: {
                    default: 0,
                },

            }

        }, schema, true) );

    }

}

module.exports = {
    GenesisDBSchemaBuild,
    GenesisDBSchemaBuilt: new GenesisDBSchemaBuild()
}