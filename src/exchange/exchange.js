import ExchangeOfferTypeEnum from "./data/exchange-offer-type-enum"
import ExchangeOfferValidator from "./validator/exchange-offer-validator";
import ExchangeOfferCreator from "./creator/exchange-offer-creator";

import AvailablePayments from "./data/available-payments"
import ExchangeOfferBuy from "./data/buy/exchange-offer-buy";
import ExchangeOfferSell from "./data/sell/exchange-offer-sell";

const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception} = global.kernel.helpers;
const  {setAsyncInterval, clearAsyncInterval} = global.kernel.helpers.AsyncInterval;

class Exchange extends DBSchema{

    constructor(scope){

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "exchange",
                    fixedBytes: 8,
                },

            }

        }) );

        if (!this._scope.AvailablePayments) this._scope.AvailablePayments = AvailablePayments;
        if (!this._scope.ExchangeOfferBuy) this._scope.ExchangeOfferBuy = ExchangeOfferBuy;
        if (!this._scope.ExchangeOfferSell) this._scope.ExchangeOfferSell = ExchangeOfferSell;

        if (!this.availablePayments) this.availablePayments = new this._scope.AvailablePayments(this._scope);


        this.exchangeOfferValidator = new ExchangeOfferValidator(this._scope );
        this.exchangeOfferCreator = new ExchangeOfferCreator(this._scope );

        this.exchangeData = [
            this._scope.ExchangeOfferBuy,
            this._scope.ExchangeOfferSell,
        ];

        this._init = false;

    }

    async initializeExchange(){

        if (this._init) return true;

        if (this._scope.argv.testnet.createNewTestNet )
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMasterCluster) {

                await this._scope.db.deleteAll( this._scope.ExchangeOfferBuy, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true } );
                await this._scope.db.deleteAll( this._scope.ExchangeOfferSell, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true } );

            }


        if ( this._scope.masterCluster.isMasterCluster || !this._scope.db.isSynchronized)
            this._updateExpiredExchangeOffersInterval = setAsyncInterval( this._updateExpiredExchangeOffers.bind(this), 60*1000 );


        if ( this._scope.db.isSynchronized ) {

            await this.subscribe();

            this.subscription.on( async message => {

                try{

                    this._scope.logger.info(this, "exchange subscription", message.name);

                    if (message.name === "exchange/insert-offer"){
                        await this._includeExchangeOffer(message.data.offer, false, false, true );
                    }

                }catch(err){
                    this._scope.logger.error(err);
                }

            });

        }

        this._init = true;
        return true;
    }


    async newExchangeOffer( offer, propagateOfferMasterCluster, validateOffer, senderSockets ){

        let lock;

        if (this._scope.db.isSynchronized) lock = await this.lock(-1);

        let out, error;

        try{

            out = await this._includeExchangeOffer(offer, propagateOfferMasterCluster, validateOffer, true, senderSockets);


        }catch(err){
            error = err;
        }finally{
            if (lock) lock();
        }

        if (error) throw error;

        return out;
    }

    async _includeExchangeOffer(offer, propagateOfferMasterCluster, validateOffer = true, propagateToSockets=true, senderSockets){

        offer = this.exchangeOfferValidator.validateExchangeOffer(offer);

        if (!offer) throw new Exception(this, 'offer is invalid');
        if (offer.height >= this._scope.mainChain.data.end) throw new Exception(this, "Height is larger than the block length");

        if (validateOffer)
            if (!offer.verifyOffer()) throw new Exception(this, "Digital signatures are invalid");

        const exchangeSchemaClass = this.getExchangeSchemaClass(offer.type);

        const schemaObject = new exchangeSchemaClass( this._scope, undefined, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true }  );
        schemaObject.id = offer.publicKeyHash.toString("hex");

        const exists = await schemaObject.exists();

        if (exists){

            await schemaObject.load();

            if (offer.height < schemaObject.height ) throw new Exception(this, "Height is less than the offer I have");
            else
            if (offer.height === schemaObject.height ) return false;



        }

        const balances = await this._scope.mainChain.data.accountHashMap.getBalances( offer.publicKeyHash );
        if (!balances) throw new Exception(this, "Empty accounts are not allowed to publish offers");

        schemaObject.fromJSON( offer.toJSON() );
        schemaObject.score = await schemaObject.calculateScore();

        if (propagateOfferMasterCluster || !this._scope.db.isSynchronized )
            await schemaObject.save();


        if (propagateOfferMasterCluster && this._scope.db.isSynchronized ){
            await this.subscribeMessage("exchange/insert-offer", {
                offer: schemaObject.toBuffer(),
            }, true, false);
        }

        if (propagateToSockets)
            await this._scope.mainChain.emit("exchange/offer-included", {
                data: { offer },
                senderSockets,
            });

        return true;
    }

    async _updateExpiredExchangeOffers(){

        try{

            for (const exchangeSchemaClass of this.exchangeData ) { // buy and sel

                const count = await exchangeSchemaClass.count( this._scope.db, undefined, '', {skipProcessingConstructionValues: true, skipValidation: true } )
                if (count === 0) continue;

                const index = Math.floor( Math.random()  * count );

                const out = await this._scope.db.scan( exchangeSchemaClass, index, 1, '', '', {skipProcessingConstructionValues: true, skipValidation: true } );

                if (!out) continue;

                const offer = out[0];

                if (offer.isExpired()) {

                    await offer.delete();
                    continue;
                }

                const newScore = await offer.calculateScore();
                if (offer.score !== newScore) {
                    offer.score = newScore;
                    offer.save();
                }

            }


        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Update Expired Exchange Offers raised an error", err);
        }
    }


    getExchangeSchemaClass(type){
        if (type === ExchangeOfferTypeEnum.EXCHANGE_OFFER_BUY) return this.exchangeData[0];
        if (type === ExchangeOfferTypeEnum.EXCHANGE_OFFER_SELL) return this.exchangeData[1];
        throw new Exception(this, "Invalid offer type");
    }




}

export default Exchange;