const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const AddressTxHashMapElement = require( "./address-tx-hash-map-element")

/**
 * Not required for consensus. Used only for explorer
 */

module.exports = class AddressTxHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "addrTxMap",
                    fixedBytes: 9,
                },

                element: {
                    classObject: AddressTxHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}