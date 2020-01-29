const {HashVirtualMap} = global.protocol.dataStructures.hashMap;
const {Helper, Exception} = global.protocol.helpers;

import AddressTxHashMapElement from "./address-tx-hash-map-element"

/**
 * Not required for consensus. Used only for explorer
 */

export default class AddressTxHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "addrTxMap",
                    fixedBytes: 9,
                },

                element: {
                    classObject: AddressTxHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}