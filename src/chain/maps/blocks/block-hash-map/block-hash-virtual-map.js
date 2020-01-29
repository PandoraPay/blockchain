const {HashVirtualMap} = global.protocol.dataStructures.hashMap;
const {Helper, Exception} = global.protocol.helpers;

import BlockHashMapElement from "./block-hash-map-element"

/**
 * Not required for consensus. Used only for explorer
 * It stores height and returns hash
 */

export default class BlockHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "blkMap",
                    fixedBytes: 6,
                },

                element: {
                    classObject: BlockHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}