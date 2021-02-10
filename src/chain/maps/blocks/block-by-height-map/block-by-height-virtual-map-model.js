const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {BlockByHeightHashMapElementSchemaBuilt} = require( "./block-by-height-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores height and returns hash
 */

module.exports = class BlockByHeightVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema = BlockByHeightHashMapElementSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}