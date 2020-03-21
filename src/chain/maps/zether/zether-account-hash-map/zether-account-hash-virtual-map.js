
const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ZetherAccountHashMapElement from "./zether-account-hash-map-element"

/**
 * Required for consensus.
 * It assures unique token name
 */

export default class ZetherAccountHashMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "zetAccount",
                    fixedBytes: 10,
                },

                element: {
                    classObject: ZetherAccountHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}