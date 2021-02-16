const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;

const {BlockByHashMapElementSchemaBuilt} = require( "./block-by-hash-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores hash and returns height
 */

module.exports = class BlockByHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = BlockByHashMapElementSchemaBuilt;
    }

}