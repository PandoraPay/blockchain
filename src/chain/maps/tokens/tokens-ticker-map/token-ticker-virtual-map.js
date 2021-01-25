const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const TokenTickerMapElement = require( "./tocker-ticker-map-element")

/**
 * Required for consensus.
 * It assures unique token ticker
 */

module.exports = class TokenTickerVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenTickerMap",
                    fixedBytes: 14,
                },

                element: {
                    classObject: TokenTickerMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}