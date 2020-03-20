
const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ZetherLastRollOverHashMapElement from "./zether-last-roll-over-hash-map-element"

/**
 * Required for consensus.
 * It assures unique token name
 */

export default class ZetherLastRollOverHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "zetLastRollOver",
                    fixedBytes: 15,
                },

                element: {
                    classObject: ZetherLastRollOverHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}