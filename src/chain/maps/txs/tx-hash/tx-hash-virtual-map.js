const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const TxHashMapElement = require( "./tx-hash-map-element")

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: Block Height, Block Timestamp, Merkle Tree Leaf Height and Merkle Tree Height
 *
 */

module.exports = class TxHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "txMap",
                    fixedBytes: 5,
                },

                element: {
                    classObject: TxHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}