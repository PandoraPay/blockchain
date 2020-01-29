const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import TxHashMapElement from "./tx-hash-map-element"

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: Block Height, Block Timestamp, Merkle Tree Leaf Height and Merkle Tree Height
 *
 */

export default class TxHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "txMap",
                    fixedBytes: 5,
                },

                element: {
                    classObject: TxHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}