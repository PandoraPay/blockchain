const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

export default class ExchangeCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._offersDownloading = {};

        this._scope.events.on("start/chain-created", ()=>{

            this._scope.mainChain.on( "exchange/offer-included", ( {data, senderSockets } ) => {

                /**
                 * Sending notification that a new offer was included
                 */

                this._scope.masterCluster.broadcastToSocketsAsync("exchange/new-offer", { offer: data.offer.toBuffer() }, senderSockets);


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

        const exchangeSchemaClass = this._scope.exchange.getExchangeSchemaClass(offerType);
        const out = await exchangeSchemaClass.count( this._scope.db, undefined, '', {skipProcessingConstructionValues: true, skipValidation: true } );
        return out;

    }

    //TODO: right now the returned values are not sorted
    async _getExchangeContentIds({ offerType, index = 0, limit = this._scope.argv.transactions.protocol.protocolMaxExchangeOffersIds }){

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxExchangeOffersIds) );

        const exchangeSchemaClass = this._scope.exchange.getExchangeSchemaClass(offerType);
        const schemaObject = new exchangeSchemaClass( this._scope, undefined, undefined, undefined, {skipProcessingConstructionValues: true, skipValidation: true }  );

        const elements = await this._scope.db._scanMiddleware( schemaObject, '', '',  index, limit, undefined );
        const out  = elements.filter ( obj => obj );

        return {
            out,
            next: out.length === limit ? index + limit: 0,
        };
    }

    async _getExchangeContent({offerType, index = 0, limit = this._scope.argv.transactions.protocol.protocolMaxExchangeOffers, type = "buffer"  }){

        if (typeof limit !== "number") return null;
        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxExchangeOffers) );

        const ids = this._getExchangeContentIds({offerType, index, limit});
        if (!ids) return false;

        const exchangeSchemaClass = this._scope.exchange.getExchangeSchemaClass(offerType);
        const out = await this._scope.db.findBySort( exchangeSchemaClass, "scoresort", index, limit, '', '', {skipProcessingConstructionValues: true, skipValidation: true } );

        return {
            out: out.map( it => it.toType(type) ),
            next: out.length === limit ? index + limit: 0,
        }

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
                this._scope.logger.error(this, "newExchange raised an error", err);
        }

        resolver(!!out);

        delete this._offersDownloading[offerId];

        return !!out;
    }

    async _getExchangeOffer({offerHash, offerType, type = "buffer" }, res, socket){

        if (Buffer.isBuffer(offerHash)) offerHash = offerHash.toString('hex');

        const map = this._scope.exchange.getExchangeSchemaClass(offerType).map;

        const out = map[offerHash];

        if ( out ) return out.toType(type);

    }

}