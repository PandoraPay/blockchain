
const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ZetherPendingHashMapElement from "./zether-pending-hash-map-element"

/**
 * Required for consensus.
 * It assures unique token name
 */

export default class ZetherPendingHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "zetPending",
                    fixedBytes: 10,
                },

                element: {
                    classObject: ZetherPendingHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}