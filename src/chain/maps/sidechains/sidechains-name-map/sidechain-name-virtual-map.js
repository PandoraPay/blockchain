const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import SidechainNameMapElement from "./sidechain-name-map-element"

/**
 * Required for consensus.
 * It assures unique token name
 */

export default class SidechainNameVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "sidechainNameMap",
                    fixedBytes: 12,
                },

                element: {
                    classObject: SidechainNameMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}