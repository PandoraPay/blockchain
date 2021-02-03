const {BlockSchemaBuild} = require('../block-schema-build')
const {Helper} = require('kernel').helpers;

class GenesisSchemaBuild extends BlockSchemaBuild {

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
    GenesisSchemaBuild,
    GenesisSchemaBuilt: new GenesisSchemaBuild()
}