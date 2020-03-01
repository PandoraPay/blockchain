import ExchangeOffer from "../exchange-offer";
const {Helper, Exception} = global.kernel.helpers;

export default class ExchangeOfferSell extends ExchangeOffer{

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "exOfferSell",
                    fixedBytes: 11,
                },

            }
        }, schema, false), data, type, creationOptions)

    }

}