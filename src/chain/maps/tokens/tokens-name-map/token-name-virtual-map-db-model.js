const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {TokenNameMapElementDBSchemaBuilt} = require( "./token-name-map-element-db-schema-build")

/**
 * Required for consensus.
 * It assures unique token name
 */

module.exports = class TokenNameVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = TokenNameMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}