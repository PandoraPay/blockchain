const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const BlockHashMapElement = require( "./block-hash-map-element")

/**
 * Not required for consensus. Used only for explorer
 * It stores height and returns hash
 */

module.exports = class BlockHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "blkMap",
                    fixedBytes: 6,
                },

                element: {
                    classObject: BlockHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}