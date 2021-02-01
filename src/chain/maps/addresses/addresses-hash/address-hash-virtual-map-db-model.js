const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {AddressHashMapElementDBSchemaBuilt} = require( "./address-hash-map-element-db-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: TransactionsCount associated with an address
 *
 */

module.exports = class AddressHashVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = AddressHashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}