const {SocketRouterPlugin} = require('networking').sockets.protocol;
const {Exception, StringHelper, BufferHelper, EnumHelper} = require('kernel').helpers;
const {TxTokenCurrencyTypeEnum} = require('cryptography').transactions;

const TokenHashMapElementModel = require("../../chain/maps/tokens/tokens-hash/token-hash-map-element-model")

module.exports = class TokenCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope) {
        super(scope);
    }


    getOneWayRoutes() {

        return {

            "tokens/get-token": {
                handle: this._getToken,
                maxCallsPerSecond: 50,
                descr: "If [token] is not specified\n" +
                    "If [token] is specified. "
            },

            "tokens/content-count":{
                handle: this._getContentCount,
                maxCallsPerSecond: 100,
                descr: "Number of tokens",
            },

            "tokens/content-ids":{
                handle: this._getContentIds,
                maxCallsPerSecond: 100,
                descr: "Get tokens ids",
            },

            "tokens/content":{
                handle: this._getContent,
                maxCallsPerSecond: 100,
                descr: "Get tokens",
            },

        }
    }

    getTwoWaysRoutes() {

        return {}
    }

    async _getToken( { token }){

        if (!Buffer.isBuffer(token) && ( StringHelper.isHex(token) || !token ) ) token = Buffer.from(token, "hex");

        if (token.equals(TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer)) //00 token
            return {
                version:0,
                name: "PANDORA",
                ticker: "PAND",
                description: "Native token",
                tokenPublicKeyHash: token,
                decimalSeparator: 5,
                supply: this._scope.mainChain.data.circulatingSupply,
            };

        const out = await this._scope.mainChain.data.tokenHashMap.getTokenNode( token);

        if (out) {

            const json = out.toJSON();

            return json;
        }


    }

    _getContentCount(){

        const out = this._scope.mainChain.data.tokensIndex;
        return out;

    }

    async _getContentIds({ index = 0, limit = this._scope.argv.transactions.protocol.protocolMaxTokensIds }){

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTokensIds) );

        const obj = new TokenHashMapElementModel(this._scope);

        const elements = await this._scope.db._scanMiddleware( obj, '', '',  index, limit, undefined );
        const out  = elements.filter ( obj => obj );

        return {
            out,
            next: out.length === limit ? index + limit : 0,
        };
    }

    async _getContent({ index = 0, limit = this._scope.argv.transactions.protocol.protocolMaxTokens }){

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTokens) );

        const out = await this._scope.db.scan( TokenHashMapElementModel, undefined, index, limit, '', '', undefined );

        return {
            out,
            next: out.length === limit ? index + limit : 0,
        };
    }

}