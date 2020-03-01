import ExchangeOfferTypeEnum from "./data/exchange-offer-type-enum"
import ExchangeOfferValidator from "./validator/exchange-offer-validator";
import ExchangeOfferCreator from "./creator/exchange-offer-creator";

import AvailablePayments from "./data/available-payments"
import ExchangeOfferBuy from "./data/buy/exchange-offer-buy";
import ExchangeOfferSell from "./data/sell/exchange-offer-sell";
import DelegatedStake from "../wallet-stakes/delegated-stake/delegated-stake";

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

        this.exchangeOfferBuyMap = {};
        this.exchangeOfferBuyArray = [];

        this.exchangeOfferSellMap = {};
        this.exchangeOfferSellArray = [];

        this.exchangeData = [
            {
                schema: this._scope.ExchangeOfferBuy,
                map: this.exchangeOfferBuyMap,
                array: this.exchangeOfferBuyArray,
            },
            {
                schema: this._scope.ExchangeOfferSell,
                map: this.exchangeOfferSellMap,
                array: this.exchangeOfferSellArray
            },
        ];

        this._init = false;

        this._removeExpiredExchangeOffersHashMapsInterval = setAsyncInterval( this._removeExpiredExchangeOffersHashMaps.bind(this), 60*60*1000 );

    }

    async initializeExchange(){

        if (this._init) return true;

        if (this._scope.argv.blockchain.genesisTestNet.createNewTestNet )
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMasterCluster) {

                await this._scope.db.deleteAll( this._scope.ExchangeOfferBuy, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true } );
                await this._scope.db.deleteAll( this._scope.ExchangeOfferSell, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true } );

            }

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

    async reload(){

        try{


            for (const item of this.exchangeData ){


                const out = await this._scope.db.findAll( item.schema, undefined, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true } );

                if (out)
                    for (const offer in out) {
                        item.array.push(offer);
                        item.map[offer.id] = offer;
                    }

            }

        }catch(err){
            this._scope.logger.error(this, 'Error reloading exchange data', err);
        }

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

        this._scope.logger.info(this, Buffer.isBuffer(offer) ? offer.toString("hex" ) : 'object' );

        offer = this.exchangeOfferValidator.validateExchangeOffer(offer);

        if (offer.height >= this._scope.mainChain.data.end) throw new Exception(this, "Height is larger than the block length");

        if (validateOffer)
            if (!offer.verifyOffer()) throw new Exception(this, "Digital signatures are invalid");

        const exchangeData = this.getExchangeData(offer.type);

        let schemaObject = exchangeData.map[ offer.publicKeyHash.toString('hex') ];

        if (schemaObject){

            if (offer.height < schemaObject.height ) throw new Exception(this, "Height is less than the offer I have");
            else
            if (offer.height === schemaObject.height ) {

                const compare = schemaObject.hash().compare(offer.hash() );
                if ( compare < 0) throw new Exception(this, "Previous Hash is better");
                if ( compare === 0) return false; //it is the same
            }


        }

        const balances = await this._scope.mainChain.data.accountHashMap.getBalances( offer.publicKeyHash );
        if (!balances) throw new Exception(this, "Empty accounts are not allowed to publish offers");

        if ( !schemaObject ){
            schemaObject = new exchangeData.schema( this._scope, undefined, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true }  );
            schemaObject.id = offer.publicKeyHash.toString("hex");
        }

        schemaObject.fromJSON( offer.toJSON() );

        if (propagateOfferMasterCluster || !this._scope.db.isSynchronized )
            await schemaObject.save();

        if ( ! exchangeData.map[ schemaObject.id ] ) {
            exchangeData.array.push(schemaObject);
            exchangeData.map[ schemaObject.id ] = schemaObject;
        }

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

    async _removeExpiredExchangeOffersHashMaps(){
        try{

            for (const item of this.exchangeData )
                for (let i=item.array.length-1; i >= 0 ; i-- )
                    if (item.array[i].isExpired()){

                        const offer = item.array[i];

                        item.array.splice(i, 1);
                        delete item.map[ offer.id ];

                        await offer.delete();

                    }


        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Saving Exchange Offers raised an error", err);
        }
    }

    getExchangeData(type){
        if (type === ExchangeOfferTypeEnum.EXCHANGE_OFFER_BUY) return this.exchangeData[0];
        if (type === ExchangeOfferTypeEnum.EXCHANGE_OFFER_SELL) return this.exchangeData[1];
        throw new Exception(this, "Invalid offer type");
    }




}

export default Exchange;