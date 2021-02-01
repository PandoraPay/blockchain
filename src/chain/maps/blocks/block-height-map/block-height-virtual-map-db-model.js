const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {BlockHeightHashMapElementDBSchemaBuilt} = require( "./block-height-map-element-db-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores height and returns hash
 */

module.exports = class BlockHeightVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = BlockHeightHashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}