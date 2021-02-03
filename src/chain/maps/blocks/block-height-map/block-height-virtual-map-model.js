const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {BlockHeightHashMapElementSchemaBuilt} = require( "./block-height-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores height and returns hash
 */

module.exports = class BlockHeightVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema = BlockHeightHashMapElementSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}