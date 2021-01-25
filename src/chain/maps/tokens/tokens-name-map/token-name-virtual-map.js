const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const TokenNameMapElement = require( "./token-name-map-element")

/**
 * Required for consensus.
 * It assures unique token name
 */

module.exports = class TokenNameVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenNameMap",
                    fixedBytes: 12,
                },

                element: {
                    classObject: TokenNameMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}