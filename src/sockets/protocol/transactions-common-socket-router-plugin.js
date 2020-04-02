const {SocketRouterPlugin} = global.networking.sockets.protocol;

export default class TransactionsCommonSocketRouterPlugin extends SocketRouterPlugin {

    getOneWayRoutes(){

        return {

            "transactions/get-raw-transaction": {
                handle:  this._getRawTransaction,
                maxCallsPerSecond:  50,
                descr: "Returns raw transaction representation for given transaction id from Blockchain only. "
            },

            "transactions/get-transaction": {
                handle:  this._getTransaction,
                maxCallsPerSecond:  50,
                descr: "Returns transaction representation for given transaction id from Blockchain and MemPool. "
            },

            "transactions/account/get-transaction-count":{
                handle: this._getAccountTransactionsCount,
                maxCallsPerSecond: 50,
                descr: "Returns the number of transactions sent from an account."
            },

            "transactions/account/get-transactions-ids":{
                handle: this._getAccountTransactionsIds,
                maxCallsPerSecond: 50,
                descr: "Returns transactions sent from an account."
            },

            "transactions/account/get-transactions":{
                handle: this._getAccountTransactions,
                maxCallsPerSecond: 50,
                descr: "Returns transactions sent from an account."
            },


        }

    }

    async _getRawTransaction({hash, type = "buffer"}){

        if (Buffer.isBuffer(hash)) hash = txId.toString("hex");
        if (typeof hash !== "string" && hash.length !== 64) throw new Exception(this, "TxId is invalid");

        const out = await this._scope.mainChain.data.getTransactionByHash( hash );

        if (out) return out.tx.toType(type);
        else return null;

    }

    async _getTransaction({hash, type = "json"}){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (typeof hash !== "string" && hash.length !== 64) throw new Exception(this, "TxId is invalid");

        const chainData = this._scope.mainChain.data;


        //included in mem pool
        const memPoolTx = this._scope.memPool.transactions[hash];
        if (memPoolTx) return {
            tx: (type === "json") ? memPoolTx.toJSONRaw() : memPoolTx.toType(type),
            memPool: true,
            memPoolQueued: !!this._scope.memPool.queuedTxs[hash],
            txId: memPoolTx.hash().toString("hex"),
        };

        //included in blockchain
        const out = await chainData.getTransactionByHash( hash );

        if (out) return {
            tx: (type === "json") ? out.tx.toJSONRaw() : out.tx.toType(type),
            block: out.block,
            blockTimestamp: out.blockTimestamp,
            confirmations: chainData.end - out.block,
            txId: out.tx.hash().toString("hex"),
        };


        return null;
    }

    async _getAccountTransactionsCount({account}){

        if (typeof account !== "string") return null;

        const chainData = this._scope.mainChain.data;

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash.toString("hex");

        const addressHashMapOut = await chainData.addressHashMap.getMap( publicKeyHash );
        if (addressHashMapOut)
            return addressHashMapOut.data.txsCount;

        return null;
    }


    async _getAccountTransactionsIds({account, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.transactions.protocol.protocolMaxTransactionsIds}){

        if (typeof index !== "number") throw new Exception(this, "Index is not number");
        if (typeof limit !== "number") throw new Exception(this, "Limit is not a number");
        if (typeof account !== "string") throw new Exception(this, "Account is not provided");

        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTransactionsIds) );

        const chainData = this._scope.mainChain.data;

        const address = this._scope.cryptography.addressValidator.validateAddress( account );
        const publicKeyHash = address.publicKeyHash.toString("hex");

        const addressHashMapOut = await chainData.addressHashMap.getMap( publicKeyHash );
        if (addressHashMapOut)
            index = Math.min( index, addressHashMapOut.data.txsCount);
        else return null;

        const startIndex = Math.max(0, index-limit );

        const promises = [];
        for (let i=startIndex; i < index; i++)
            promises.push( chainData.addressTxHashMap.getMap(publicKeyHash + "_" + i ) );

        const out = await Promise.all(promises);

        const result = {};
        for (let i=0; i < out.length; i++)
            result[startIndex+i] = out[i] ? out[i].data : undefined;

        return {
            out: result,
            next: startIndex > 0 ? startIndex-1 : 0,
        };
    }

    async _getAccountTransactions({account, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.transactions.protocol.protocolMaxTransactions, type}){

        if (typeof limit !== "number") throw new Exception(this, "Limit is not a number");
        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTransactions) );

        const ids = await this._getAccountTransactionsIds({account, index, limit});

        const promises = [];
        for (const key in ids.out ){

            const hash = ids.out[key];

            const promise = this._getTransaction({hash, type});
            promises.push( promise );

            ids.out[key] = promise;
        }

        const out = await Promise.all(promises);

        for (const key in ids.out)
            ids.out[key] = await ids.out[key];

        return ids;
    }

}