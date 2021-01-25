const {HashVirtualMap} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const TxRevertInfoHashMapElement = require( "./tx-revert-info-hash-map-element")

/**
 * Required for consensus. Used only for explorer
 * Stores json info related to revert a Transaction
 *
 */

module.exports = class TxRevertInfoHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "txRevertMap",
                    fixedBytes: 11,
                },

                element: {
                    classObject: TxRevertInfoHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}