const {Exception, EnumHelper, StringHelper, BufferHelper} = global.kernel.helpers;
import ExchangeOffer from "./../data/exchange-offer"

export default class ExchangeOfferValidator{

    constructor(scope){
        this._scope = scope;
    }

    validateExchangeVersion(version){
        if (version === 0) return true;
    }

    getExchangeOfferClass(input){

        if (typeof input === "string") {

            if (StringHelper.isHex(input))
                input = Buffer.from(input, "hex");
            else
                input = JSON.parse(input);

        }

        let version;

        if (Buffer.isBuffer(input )) version = input[0];
        else if ( input instanceof ExchangeOffer) version = input.version;
        else if ( typeof input === "object" ) version = input.version;

        if (this.validateExchangeVersion(version) ) return ExchangeOffer;

        throw new Exception(this, "Exchange Offer couldn't be identified by version", version);

    }

    validateExchangeOffer(input){

        const exchangeOfferClass = this.getExchangeOfferClass( input );
        return new exchangeOfferClass( this._scope, undefined, input )

    }

    cloneExchangeOffer(input){
        return this.validateExchangeOffer(input);
    }

}