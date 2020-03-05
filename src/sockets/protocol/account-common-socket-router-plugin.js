const {SocketRouterPlugin, StringHelper, BufferHelper, EnumHelper} = global.networking.sockets.protocol;
const {Exception} = global.kernel.helpers;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

/**
 * https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
 */

export default class AccountCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){
        super(scope);
    }

    getOneWayRoutes(){

        return {

            "account/get-account":{
                handle:  this._getAccount,
                maxCallsPerSecond:  50,
                descr: "If [account] is not specified, returns the server's account.\n" +
                    "If [account] is specified, returns the account. "
            },

            "account/get-balance":{
                handle:  this._getBalance,
                maxCallsPerSecond:  50,
                descr: "If [account] is not specified, returns the server's total available balance.\n" +
                    "If [account] is specified, returns the balance in the account. "
            },

            "account/get-nonce":{
                handle:  this._getNonce,
                maxCallsPerSecond:  50,
                descr: "If [account] is not specified, returns the server's nonce.\n" +
                    "If [account] is specified, returns the nonce in the account. "
            },

            "account/get-delegate":{
                handle:  this._getDelegate,
                maxCallsPerSecond:  50,
                descr: "If [account] is not specified, returns the server's delegate.\n" +
                    "If [account] is specified, returns the delegate in the account. "
            },

            "account/get-balance-including-mem-pool":{
                handle:  this._getBalanceIncludingMemPool,
                maxCallsPerSecond:  50,
                descr: "If [account] is not specified, returns the server's total available balance including mem pool.\n" +
                    "If [account] is specified, returns the balance in the account including mem pool. "
            },

            "account/get-nonce-including-mem-pool":{
                handle:  this._getNonceIncludingMemPool,
                maxCallsPerSecond:  50,
                descr: "If [account] is not specified, returns the server's nonce including mem pool.\n" +
                    "If [account] is specified, returns the nonce including mem pool. "
            },

        }

    }

    getTwoWaysRoutes(){

        return {

            // "account/subscribe/balance":{
            //     handle:  this._subscribeBalance,
            //     maxCallsPerSecond:  50,
            //     descr: "If [account] is not specified, returns the server's total available balance.\n" +
            //         "If [account] is specified, returns the balance in the account. "
            // },
            //
            // "account/subscribe/nonce":{
            //     handle:  this._subscribeNonce,
            //     maxCallsPerSecond:  50,
            //     descr: "If [account] is not specified, returns the server's total available balance.\n" +
            //         "If [account] is specified, returns the balance in the account. "
            // },

        }

    }

    async _getAccount({account }){

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;


        const out = await this._scope.mainChain.data.accountHashMap.getAccountNode( publicKeyHash);
        if (out) {
            const json = out.toJSON();
            json.delegate.delegatePublicKey = out.delegate.delegatePublicKey.toString("hex");
            return json;
        }


    }
    async _getBalance({account, token}){

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;

        let out;
        if (token) out = await this._scope.mainChain.data.accountHashMap.getBalance( publicKeyHash, token );
        else out = await this._scope.mainChain.data.accountHashMap.getBalances( publicKeyHash );

        return out;

    }

    async _getNonce({account}){

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;

        const out = await this._scope.mainChain.data.accountHashMap.getNonce( publicKeyHash );

        return out;

    }

    async _getDelegate({account}){

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;

        const out = await this._scope.mainChain.data.accountHashMap.getDelegate( publicKeyHash );

        return out;

    }

    async _getBalanceIncludingMemPool({account, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id}){

        const chainData = this._scope.mainChain.data;

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        await chainData.tokenHashMap.currencyExists(tokenCurrency);

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;

        let out;
        if (tokenCurrency){
            out = await chainData.accountHashMap.getBalance( publicKeyHash, tokenCurrency );
            const memPoolOut = this._scope.memPool.getMemPoolPendingBalance(account, tokenCurrency)[tokenCurrency.toString("hex")] || 0;
            return out + memPoolOut;
        }
        else {

            out = await chainData.accountHashMap.getBalances( publicKeyHash );
            const memPoolOut = this._scope.memPool.getMemPoolPendingBalance(account, tokenCurrency);

            const already = {};

            for (const key in out ) {
                out[key] = out[key] + (memPoolOut[key] || 0);
                already[key] = true;
            }

            for (const key in memPoolOut )
                if (!already[key])
                    out[key] = memPoolOut[key];

            return out;
        }



    }

    async _getNonceIncludingMemPool({account}){

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;

        const accountNonce = await this._scope.mainChain.data.accountHashMap.getNonce( publicKeyHash );

        const nonce = this._scope.memPool.getMemPoolTransactionNonce(publicKeyHash, accountNonce );

        return nonce;
    }




    async _subscribeBalance({account, token}, cb, notify, socket ){

        throw {message: "not implemented"};

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;

        if (token && typeof token === "string" ) token = Buffer.from(token, "hex");

        if (token) throw new Exception(this, "Token subscription is not supported right now");

        let out;
        if (token) out = await this._scope.mainChain.data.accountHashMap.getBalance( publicKeyHash, token );
        else out = await this._scope.mainChain.data.accountHashMap.getBalances( publicKeyHash );

        socket.subscribe(`balance-changed/${publicKeyHash.toString("hex")}${ token ? '/'+token.toString("hex") : '' }`, notify );

        return out;

    }

    async _subscribeNonce({account}, cb, notify, socket){

        throw {message: "not implemented"};

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash;

        const out = await this._scope.mainChain.data.accountHashMap.getNonce( publicKeyHash );

        return out;

    }

}