const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {BlockHashMapElementDBSchemaBuilt} = require( "./block-hash-map-element-db-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores hash and returns height
 */

module.exports = class BlockHashVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = BlockHashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}