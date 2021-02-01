const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {AddressTxHashMapElementDBSchemaBuilt} = require( "./address-tx-hash-map-element-db-schema-build")

/**
 * Not required for consensus. Used only for explorer
 */

module.exports = class AddressTxHashVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = AddressTxHashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}