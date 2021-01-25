const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const AddressHashMapElement = require( "./address-hash-map-element")

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: TransactionsCount associated with an address
 *
 */

module.exports = class AddressHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "addrMap",
                    fixedBytes: 7,
                },

                element: {
                    classObject: AddressHashMapElement,
                },

            },


        }, schema, false), data, type, creationOptions);

    }

}