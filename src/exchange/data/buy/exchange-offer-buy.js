import ExchangeOffer from "../exchange-offer";
const {Helper, Exception} = global.kernel.helpers;

export default class ExchangeOfferBuy extends ExchangeOffer{

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "exOfferBuy",
                    fixedBytes: 10,
                },

            }
        }, schema, false), data, type, creationOptions)

    }

}