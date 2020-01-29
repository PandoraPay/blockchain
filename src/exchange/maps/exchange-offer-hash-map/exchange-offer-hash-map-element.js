const {HashMapElement} = global.protocol.dataStructures.hashMap;
const {Helper, Exception} = global.protocol.helpers;

import ExchangeOffer from "./../../data/exchange-offer"

export default class TxHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                id:{
                    fixedBytes: 40, //publicKeyHash
                },

                table: {
                    default: "exOfferHash",
                    fixedBytes: 11,
                },

                data: {
                    type: "object",
                    classObject: ExchangeOffer,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}