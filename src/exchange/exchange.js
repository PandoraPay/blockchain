import ExchangeOfferBuyHashVirtualMap from "./maps/exchange-offer-buy-hash-map/exchange-offer-buy-hash-virtual-map"
import ExchangeOfferSellHashVirtualMap from "./maps/exchange-offer-sell-hash-map/exchange-offer-sell-hash-virtual-map"

import ExchangeOfferTypeEnum from "./data/exchange-offer-type-enum"
import ExchangeOfferValidator from "./validator/exchange-offer-validator";
import AvailablePayments from "./data/available-payments"
import ExchangeOffer from "./data/exchange-offer";

const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception} = global.kernel.helpers;
const  {setAsyncInterval, clearAsyncInterval} = global.kernel.helpers.AsyncInterval;

class Exchange extends DBSchema{

    constructor(scope){

        super(scope);

        if (!this._scope.AvailablePayments) this._scope.AvailablePayments = AvailablePayments;
        if (!this._scope.ExchangeOfferBuyHashVirtualMap) this._scope.ExchangeOfferBuyHashVirtualMap = ExchangeOfferBuyHashVirtualMap;
        if (!this._scope.ExchangeOfferSellHashVirtualMap) this._scope.ExchangeOfferSellHashVirtualMap = ExchangeOfferSellHashVirtualMap;

        if (!this.availablePayments) this.availablePayments = new this._scope.AvailablePayments(this._scope);


        this.exchangeOfferValidator = new ExchangeOfferValidator(this._scope );

        this._exchangeOfferBuyHashMap = new this._scope.ExchangeOfferBuyHashVirtualMap(this._scope);
        this.exchangeOfferBuyMap = {};
        this.exchangeOfferBuyArray = [];

        this._exchangeOfferSellHashMap = new this._scope.ExchangeOfferSellHashVirtualMap(this._scope);
        this.exchangeOfferSellMap = {};
        this.exchangeOfferSellArray = [];

        this.exchangeData = [
            {
                hashMap: this._exchangeOfferBuyHashMap,
                map: this.exchangeOfferBuyMap,
                array: this.exchangeOfferBuyArray,
            },
            {
                hashMap: this._exchangeOfferSellHashMap,
                map: this.exchangeOfferSellMap,
                array: this.exchangeOfferSellArray
            },
        ];

        this._init = false;

        this._saveExchangeOffersHashMapsInterval = setAsyncInterval( this._saveExchangeOffersHashMaps.bind(this), 5*60*1000 );
        this._removeExpiredExchangeOffersHashMapsInterval = setAsyncInterval( this._removeExpiredExchangeOffersHashMaps.bind(this), 60*60*1000 );

    }

    async initializeExchange(){

        if (this._init) return true;

        if (this._scope.argv.blockchain.genesisTestNet.createNewTestNet )
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMasterCluster) {
                await this._exchangeOfferBuyHashMap.clearHashMap();
                await this._exchangeOfferSellHashMap.clearHashMap();

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

                await item.hashMap.loadAllInVirtualMap();
                const virtualMap = item.hashMap._virtualMap;

                for (const key in virtualMap)
                    if (virtualMap[key].type === "add" || virtualMap[key].type === "view" ) {
                        item.array.push( virtualMap[key].element );
                        item.map[ virtualMap[key].element.data.hash().toString("hex") ].array.push( virtualMap[key].element );
                    }

            }

        }catch(err){

        }

    }

    createExchangeOffer( offerData ){
        const offer = new ExchangeOffer(this._scope,undefined, offerData);
        return offer;
    }

    async newExchangeOffer( offer, propagateOfferMasterCluster, validateOffer, senderSockets ){

        try{

            const out = await this._includeExchangeOffer(offer, propagateOfferMasterCluster, validateOffer, true, senderSockets);
            return out;

        }catch(err){
            this._scope.logger.error(this, "Error adding exchange offer ", err);
        }

    }

    async _includeExchangeOffer(offer, propagateOfferMasterCluster, validateOffer = true, propagateToSockets=true, senderSockets){

        this._scope.logger.info(this, Buffer.isBuffer(offer) ? offer.toString("hex" ) : 'object' );

        offer = this.exchangeOfferValidator.validateExchangeOffer(offer);

        if (offer.height >= this._scope.mainChain.data.end) throw new Exception(this, "Height is larger than the block length");

        if (validateOffer)
            if (!offer.verifyOffer()) throw new Exception(this, "Digital signatures are invalid");

        const exchangeData = this.getExchangeData(offer.type);

        const result = await exchangeData.hashMap.getMap( offer.publicKeyHash );

        if (result){

            if (offer.height < result.data.height ) throw new Exception(this, "Height is less than the offer I have");
            else
            if (result.data.height === offer.height ) {

                const compare = result.data.hash().compare(offer.hash() );
                if ( compare < 0) throw new Exception(this, "Previous Hash is better");
                if ( compare === 0) return false; //it is the same
            }


        }

        const balances = await this._scope.mainChain.data.accountTree.getBalances( offer.publicKeyHash );
        if (!balances) throw new Exception(this, "Empty accounts are not allowed to publish offers");

        if (result ){

            //let's delete the previous element
            delete exchangeData.map[ result.data.hash().toString("hex") ];
            for (let i=0; i < exchangeData.array.length; i++)
                if (exchangeData.array[i] === result){
                    exchangeData.array.splice(i, 1);
                    break;
                }

        }

        const out = await exchangeData.hashMap.updateMap(offer.publicKeyHash, offer );

        exchangeData.array.push(out);
        exchangeData.map[ offer.hash().toString("hex") ] = out;

        if (propagateOfferMasterCluster && this._scope.db.isSynchronized ){
            await this.subscribeMessage("exchange/insert-offer", {
                offer: offer.toBuffer(),
            }, false);
        }

        if (propagateToSockets)
            await this._scope.mainChain.emit("exchange/offer-included", {
                data: { offer },
                senderSockets,
            });

        return true;
    }

    async _saveExchangeOffersHashMaps(){
        try{

            for (const item of this.exchangeData )
                await item.hashMap.saveVirtualMap(false);

        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Saving Exchange Offers raised an error", err);
        }
    }

    async _removeExpiredExchangeOffersHashMaps(){
        try{

            for (const item of this.exchangeData )
                for (let i=item.array.length-1; i >= 0 ; i-- )
                    if (item.array[i].isExpired()){

                        item.splice(i, 1);
                        delete item.map[item.array[i].hash().toString("hex")];
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