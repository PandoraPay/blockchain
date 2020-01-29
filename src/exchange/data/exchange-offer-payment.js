const {DBSchema} = global.protocol.marshal.db;
const {Helper, Exception} = global.protocol.helpers;

export default class ExchangeOfferPayment extends DBSchema {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table:{
                    default: "exOfferPayment",
                    fixedBytes: 14,
                },

                name:{
                    type: "string",
                    minSize: 3,
                    maxSize: 100,
                    position: 100,
                },

            },

            options: {
                hashing: {
                    enabled: true,
                    fct: b => b,
                }
            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, false), data, type, creationOptions);

    }

}