const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {AddressHashMapElementSchemaBuild} = require( "./address-hash-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: TransactionsCount associated with an address
 *
 */

module.exports = class AddressHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema = AddressHashMapElementSchemaBuild, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}