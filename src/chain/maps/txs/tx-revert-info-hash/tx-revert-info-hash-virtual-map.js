const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import TxRevertInfoHashMapElement from "./tx-revert-info-hash-map-element"

/**
 * Required for consensus. Used only for explorer
 * Stores json info related to revert a Transaction
 *
 */

export default class TxRevertInfoHashVirtualMap extends HashVirtualMap {

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