const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Exception, StringHelper, BufferHelper, EnumHelper} = global.kernel.helpers;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

export default class TokenCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope) {
        super(scope);
    }


    getOneWayRoutes() {

        return {
            "token/get-token": {
                handle: this._getToken,
                maxCallsPerSecond: 50,
                descr: "If [token] is not specified\n" +
                    "If [token] is specified. "
            },
        }
    }

    getTwoWaysRoutes() {

        return {}
    }

    async _getToken( { token }){

        if (!token) throw new Exception(this, 'token was not specified');
        if (!Buffer.isBuffer(token) && StringHelper.isHex(token) ) token = Buffer.from(token, "hex");

        if (token.equals(TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer)) //00 token
            return {
                version:0,
                name: "PANDORA",
                ticker: "PAN",
                description: "Privacy Coin",
                tokenPublicKeyHash: token,
                decimalSeparator: 5,
            };

        const out = await this._scope.mainChain.data.tokenHashMap.getTokenNode( token);

        if (out) {

            const json = out.toJSON();
            return json;
        }


    }

}