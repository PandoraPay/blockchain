const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import TokenNameMapElement from "./token-name-map-element"

/**
 * Required for consensus.
 * It assures unique token name
 */

export default class TokenNameVirtualMap extends HashVirtualMap {

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