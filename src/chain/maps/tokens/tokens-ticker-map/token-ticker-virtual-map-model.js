const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {Helper, Exception} = PandoraLibrary.helpers;

const {TokenTickerMapElementSchemaBuilt} = require( "./token-ticker-map-element-schema-build")

/**
 * Required for consensus.
 * It assures unique token ticker
 */

module.exports = class TokenTickerVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = TokenTickerMapElementSchemaBuilt;
    }

}