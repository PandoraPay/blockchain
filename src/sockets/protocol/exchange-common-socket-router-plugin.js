const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception, StringHelper, EnumHelper} = global.protocol.helpers;

export default class ExchangeCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._offersDownloading = {};

        this._scope.events.on("start/chain-created", ()=>{

            this._scope.mainChain.on( "exchange/offer-included", ( {data, senderSockets } ) => {

                /**
                 * Sending notification that a new offer was included
                 */

                this._scope.masterCluster.broadcast("exchange/new-offer", { offer: data.offer.toBuffer() }, senderSockets);


            });

        });

        this._scope.events.on("master-cluster/started", ()=> this.initializePluginMasterCluster() );

    }

    async initializePluginMasterCluster(){

    }

    getOneWayRoutes(){

        return {

            "exchange/content-count": {
                handle:  this._getExchangeContentCount,
                maxCallsPerSecond:  10,
                descr: "Returns how many offers are in the exchange"
            },

            "exchange/content-ids": {
                handle:  this._getExchangeContentIds,
                maxCallsPerSecond:  10,
                descr: "Returns all offers ids "
            },

            "exchange/content": {
                handle:  this._getExchangeContent,
                maxCallsPerSecond:  10,
                descr: "Returns offers."
            },

            "exchange/get-offer": {
                handle:  this._getExchangeOffer,
                maxCallsPerSecond:  50,
                descr: "Returns offer. "
            },

            "exchange/new-offer":{
                handle:  this._newExchangeOffer,
                maxCallsPerSecond:  20,
                descr: "A new offer"
            },

        }

    }

    async _getExchangeContentCount({offerType}){

        const array = this._scope.exchange.getExchangeData(offerType).array;
        return array.length;

    }

    _getExchangeContentIds({ offerType, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.transactions.protocol.protocolMaxTransactionsIds }){

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTransactionsIds) );

        const array = this._scope.exchange.getExchangeData(offerType).array;

        index = Math.min( index, array.length );
        const startIndex = Math.max(0, index-limit );

        const out = {};

        for (let i=startIndex; i < index; i++){

            const offer = array[i].data;
            const hash = offer.hash().toString("hex");
            out[hash] = true;

        }

        return {
            out,
            next: startIndex > 0 ? startIndex-1 : 0,
        };
    }

    _getExchangeContent({offerType, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.transactions.protocol.protocolMaxTransactions, type = "buffer"  }){

        if (typeof limit !== "number") return null;
        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTransactions) );

        const ids = this._getExchangeContentIds({offerType, index, limit});
        if (!ids) return false;

        const map = this._scope.exchange.getExchangeData(offerType).map;

        for (const hash in ids.out){

            const offer = map[hash].data;
            ids.out[hash] = offer.toType(type);

        }

        return ids;
    }

    async _newExchangeOffer({offer}, res, socket){

        const offerObject = this._scope.exchange.exchangeOfferValidator.validateExchangeOffer(offer);
        const offerId = offerObject.hash().toString("hex");

        this._scope.logger.warn(this, "new offer received", { offerId });

        let resolver;
        this._offersDownloading[offerId] = new Promise( resolve => resolver = resolve);

        let out;

        try{
            out = await this._scope.exchange.newExchangeOffer( offerObject, true, true, socket);
        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "newTx raised an error", err);
        }

        resolver(!!out);

        delete this._offersDownloading[offerId];

        return !!out;
    }

    async _getExchangeOffer({offerHash, offerType, type = "buffer" }, res, socket){

        const map = this._scope.exchange.getExchangeData(offerType).map;

        const out = map[offerHash];

        if ( out ) return out.data.toType(type);

    }

}