const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {TokenTickerMapElementDBSchemaBuilt} = require( "./token-ticker-map-element-db-schema-build")

/**
 * Required for consensus.
 * It assures unique token ticker
 */

module.exports = class TokenTickerVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = TokenTickerMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}