const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ExchangeOffer from "./../../data/exchange-offer"

export default class ExchangeOfferSellHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                id:{
                    fixedBytes: 40, //publicKeyHash
                },

                table: {
                    default: "exOfferSellHash",
                    fixedBytes: 15,
                },

                data: {
                    type: "object",
                    classObject: ExchangeOffer,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}