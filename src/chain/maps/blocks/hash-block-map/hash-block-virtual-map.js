const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const HashBlockMapElement = require( "./hash-block-map-element")

/**
 * Not required for consensus. Used only for explorer
 * It stores hash and returns height
 */

module.exports = class HashBlockVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "blkHashMap",
                    fixedBytes: 10,
                },

                element: {
                    classObject: HashBlockMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}