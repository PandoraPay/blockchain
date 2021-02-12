const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;

const {BlockInfoByHashMapElementSchemaBuilt} = require( "./block-info-by-hash-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores hash and returns height
 */

module.exports = class BlockInfoByHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = BlockInfoByHashMapElementSchemaBuilt;
    }

}