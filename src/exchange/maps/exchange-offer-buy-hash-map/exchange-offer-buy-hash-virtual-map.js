const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ExchangeOfferBuyHashMapElement from "./exchange-offer-buy-hash-map-element"

/**
 * Not required for consensus, but used to store the offers.
 * Stores info related to a Exchange Offers
 *
 */

export default class ExchangeOfferBuyHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "exOfferBuyHashMap",
                    fixedBytes: 17,
                },

                element: {
                    classObject: ExchangeOfferBuyHashMapElement,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}