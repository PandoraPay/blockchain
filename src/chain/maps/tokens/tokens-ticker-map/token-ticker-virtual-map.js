const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import TokenTickerMapElement from "./tocker-ticker-map-element"

/**
 * Required for consensus.
 * It assures unique token ticker
 */

export default class TokenTickerVirtualMap extends HashVirtualMap {

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