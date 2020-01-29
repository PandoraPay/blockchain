const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import AddressHashMapElement from "./address-hash-map-element"

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: TransactionsCount associated with an address
 *
 */

export default class AddressHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "addrMap",
                    fixedBytes: 7,
                },

                element: {
                    classObject: AddressHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}