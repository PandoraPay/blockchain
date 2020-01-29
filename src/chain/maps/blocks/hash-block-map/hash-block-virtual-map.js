const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import HashBlockMapElement from "./hash-block-map-element"

/**
 * Not required for consensus. Used only for explorer
 * It stores hash and returns height
 */

export default class HashBlockVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "blkHashMap",
                    fixedBytes: 10,
                },

                element: {
                    classObject: HashBlockMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}