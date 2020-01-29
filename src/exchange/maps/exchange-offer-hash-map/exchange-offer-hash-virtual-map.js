const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ExchangeOfferHashMapElement from "./exchange-offer-hash-map-element"

/**
 * Not required for consensus, but used to store the offers.
 * Stores info related to a Exchange Offers
 *
 */

export default class ExchangeOfferHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "exOfferHash",
                    fixedBytes: 11,
                },

                element: {
                    classObject: ExchangeOfferHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}