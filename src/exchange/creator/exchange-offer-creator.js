import ExchangeOffer from "../data/exchange-offer";

const {Exception} = global.kernel.helpers;

export default class ExchangeOfferCreator {

    constructor(scope){
        this._scope = scope;
    }

    async createExchangeOffer( { privateKey, publicKey, type, title, description, amountMin, amountMax, tokenCurrency, price, height, payments, }, chain = this._scope.chain ){

        const data = {
            publicKey,
            type,
            title,
            description,
            amountMin,
            amountMax,
            tokenCurrency,
            price,
            height,
            payments,
            signature: Buffer.alloc(65),
        };

        const offer = new ExchangeOffer(this._scope,undefined, data );

        const signature = offer.signOffer( privateKey );

        return {
            offer,
            signature,
        }

    }

}