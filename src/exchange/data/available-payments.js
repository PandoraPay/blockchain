/**
 * Many thanks to BISQ community
 * https://docs.bisq.network/payment-methods.html
 */

class AvailablePayments{

    constructor(scope){

        this._scope = scope;

        this.options = {

            BTC: {
                name: "BTC",
                type: "crypto",
                position: 0,
            },

            WEBD: {
                name: "WEBD",
                type: "crypto",
                position: 1,
            },

            ETH: {
                name: "ETH",
                type: "crypto",
                position: 2,
            },

            Revolut:{
                name: "Revolut",
                type: "online",
                position: 3,
            },

            "Face-to-Face (F2F)":{
                name: "Face-to-Face (F2F)",
                type: "local",
                position: 5,
            },

            "National Bank Transfer":{
                name: "National Bank Transfer",
                type: "bank",
                position: 6,
            },

            "International Bank Transfer":{
                name: "International Bank Transfer",
                type: "bank",
                position: 7,
            },

            MoneyGram:{
                name: "MoneyGram",
                type: "bank",
                position: 8,
            },

            SEPA:{
                name: "SEPA",
                type: "bank",
                position: 9,
            },

            "SEPA Instant":{
                name: "SEPA Instant",
                type: "bank",
                position: 10,
            },

            "Western Union":{
                name: "Western Union",
                type: "bank",
                position: 11,
            },

            "Cash Deposit":{
                name: "Cash Deposit",
                type: "bank",
                position: 12,
            },

            Alipay:{
                name: "Alipay",
                type: "online",
                position: 13,
            },

            "WeChat Pay":{
                name: "WeChat Pay",
                type: "online",
                position: 14,
            },

            XMR: {
                name: "XMR",
                type: "crypto",
                position: 15,
            },


            LTC: {
                name: "LTC",
                type: "crypto",
                position: 16,
            },

        };

    }

}

export default AvailablePayments;