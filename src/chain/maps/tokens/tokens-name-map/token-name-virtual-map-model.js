const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {Helper, Exception} = PandoraLibrary.helpers;

const {TokenNameMapElementSchemaBuilt} = require( "./token-name-map-element-schema-build")

/**
 * Required for consensus.
 * It assures unique token name
 */

module.exports = class TokenNameVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = TokenNameMapElementSchemaBuilt;
    }

}