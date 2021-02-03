const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {AddressTxHashMapElementSchemaBuilt} = require( "./address-tx-hash-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 */

module.exports = class AddressTxHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema = AddressTxHashMapElementSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}