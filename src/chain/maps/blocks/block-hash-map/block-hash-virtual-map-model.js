const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {BlockHashMapElementSchemaBuilt} = require( "./block-hash-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores hash and returns height
 */

module.exports = class BlockHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema = BlockHashMapElementSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}