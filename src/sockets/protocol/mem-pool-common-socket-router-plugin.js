const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

export default class MemPoolCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._transactionsDownloading = {};

        this._scope.events.on("start/chain-created", ()=>{

            /**
             * Sending notification that a new offer was included
             */
            this._scope.mainChain.on( "mem-pool/tx-included", async ( {data, senderSockets, awaitPropagate } ) =>  {

                const out = this._scope.masterCluster.broadcastToSocketsAsync("mem-pool/new-tx-id", {txId: data.txId}, undefined, senderSockets);

                if (awaitPropagate)
                    await out;

            } );

        });

        this._scope.events.on("master-cluster/started", ()=> this.initializePluginMasterCluster() );

    }

    async initializePluginMasterCluster(){

    }

    getOneWayRoutes(){

        return {

            "mem-pool/content-count": {
                handle:  this._getMemPoolContentCount,
                maxCallsPerSecond:  10,
                descr: "Returns how many transactions are in the mem pool"
            },

            "mem-pool/content-ids": {
                handle:  this._getMemPoolContentIds,
                maxCallsPerSecond:  10,
                descr: "Returns all transaction ids in memory pool"
            },

            "mem-pool/content": {
                handle:  this._getMemPoolContent,
                maxCallsPerSecond:  10,
                descr: "queried to list the exact details of all the transactions currently pending for inclusion in the next block(s), as well as the ones that are being scheduled for future execution only."
            },

            "mem-pool/status": {
                handle:  this._getMemPoolStatus,
                maxCallsPerSecond:  50,
                descr: "queried for the number of transactions currently pending for inclusion in the next block(s), as well as the ones that are being scheduled for future execution only"
            },

            "mem-pool/new-tx-id":{
                handle:  this._newTxId,
                maxCallsPerSecond:  200,
                descr: "a new txId"
            },

            "mem-pool/new-tx":{
                handle:  this._newTx,
                maxCallsPerSecond:  20,
                descr: "a new tx"
            },

        }

    }

    async _getMemPoolContentCount({account}){

        let publicKeyHash;
        if (account){
            const address = this._scope.cryptography.addressValidator.validateAddress( account );
            publicKeyHash = address.publicKeyHash.toString("hex");
        }

        const array = (publicKeyHash ? this._scope.memPool.transactionsByPublicKeyHash[publicKeyHash] : this._scope.memPool.transactionsArray) || [];
        return array.length;

    }

    _getMemPoolContentIds({ account, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.transactions.protocol.protocolMaxTransactionsIds }){

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTransactionsIds) );

        let publicKeyHash;
        if (account){
            const address = this._scope.cryptography.addressValidator.validateAddress( account );
            publicKeyHash = address.publicKeyHash.toString("hex");
        }

        const array = (publicKeyHash ? this._scope.memPool.transactionsByPublicKeyHash[publicKeyHash] : this._scope.memPool.transactionsArray) || [];
        index = Math.min( index, array.length );
        const startIndex = Math.max(0, index-limit );

        const out = {};

        for (let i=startIndex; i < index; i++){
            const tx = array[i];

            const hash = tx.hash().toString("hex");
            out[hash] = {
                queued: !!this._scope.memPool.queuedTxs[hash],
            };

        }

        return {
            out,
            next: startIndex > 0 ? startIndex-1 : 0,
        };
    }

    _getMemPoolContent({account, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.transactions.protocol.protocolMaxTransactions  }){

        if (typeof limit !== "number") return null;
        limit = Math.max( 1, Math.min(limit, this._scope.argv.transactions.protocol.protocolMaxTransactions) );

        const ids = this._getMemPoolContentIds({account, index, limit});
        if (!ids) return false;

        for (const hash in ids.out){

            const tx = this._scope.memPool.transactions[hash];
            ids.out[hash] = {
                ...ids.out[hash],
                ...this._getTxJSON(tx),
            };

        }

        return ids;
    }

    _getMemPoolStatus(){

        const memPool = this._scope.memPool;

        return {
            pending: memPool.transactionsData.length - this._scope.memPool.queuedTxsArray.length,
            queued: this._scope.memPool.queuedTxsArray.length,
        };
    }

    async _newTxId({txId}, res, socket){

        if (Buffer.isBuffer(txId)) txId = txId.toString("hex");
        if (typeof txId !== "string" && txId.length !== 64) throw new Exception(this, "TxId is invalid");

        this._scope.logger.info(this, "new tx id received", { txId });

        if (this._transactionsDownloading[txId]) return this._transactionsDownloading[txId];
        if (this._scope.memPool.transactions[txId]) return true;

        let resolver;
        const promise = new Promise( resolve => resolver = resolve);
        this._transactionsDownloading[txId] = promise;

        let txOut;

        try{

            const tx = await socket.emitAsync('transactions/get-transaction', {hash: txId, type: "buffer"}, this._scope.argv.networkSettings.networkTimeout );

            if (tx && tx.tx)
                txOut = await this._scope.memPool.newTransaction(tx.tx, true, true, false, [socket] );
            else
                throw new Exception(this, "Tx was not downloaded", {hash: txId, tx: tx});

        }catch(err){
            //if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "newTxId raised an error", err);
        }finally{
            this._scope.logger.info(this, "new tx id received finalized", { txId });
            resolver(!!txOut);
            delete this._transactionsDownloading[txId];
        }


        return promise;
    }


    async _newTx({tx}, res, socket){

        const transaction = this._scope.mainChain.transactionsValidator.cloneTx(tx);

        const txId = transaction.hash().toString("hex");

        this._scope.logger.info(this, "new tx received", { txId, nonce: tx.nonce });

        if (this._transactionsDownloading[txId]) return this._transactionsDownloading[txId];
        if (this._scope.memPool.transactions[txId]) return true;

        let resolver;
        const promise = new Promise( resolve => resolver = resolve);
        this._transactionsDownloading[txId] = promise;


        let out;

        try{
            out = await this._scope.memPool.newTransaction( transaction, true, true, false, [socket] );
        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "newTx raised an error", err);
        }finally{
            resolver(!!out);
            delete this._transactionsDownloading[txId];
        }

        return promise;
    }

    _getTxJSON(tx){

        const json = tx.toJSON( false, undefined, { onlyFields:{
                version:true,
                scriptVersion:true,
                vin: {
                    publicKey: true,
                    amount: true,
                },
                vout: {
                    publicKeyHash: true,
                    amount: true,
                },
                nonce: true,
                tokenCurrency: true,
            } } );

        for (let i=0; i < json.vin.length; i++)
            json.vin[i].address = this._scope.cryptography.addressGenerator.generateAddressFromPublicKey( json.vin[i].publicKey ).calculateAddress();


        for (let j=0; j < json.vout.length; j++)
            json.vout[j].address = this._scope.cryptography.addressGenerator.generateAddressFromPublicKeyHash( json.vout[j].publicKeyHash ).calculateAddress();

        return json;

    }



}