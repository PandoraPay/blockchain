const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ExchangeOfferSellHashMapElement from "./exchange-offer-sell-hash-map-element"

/**
 * Not required for consensus, but used to store the offers.
 * Stores info related to a Exchange Offers
 *
 */

export default class ExchangeOfferSellHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "exOfferSellHashMap",
                    fixedBytes: 18,
                },

                element: {
                    classObject: ExchangeOfferSellHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}