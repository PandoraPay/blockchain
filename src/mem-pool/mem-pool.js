const {Helper, Exception, StringHelper, ArrayHelper} = require('kernel').helpers;
const {DBSchema} = require('kernel').marshal.db;
const {DBSchemaBufferBig, DBSchemaString} = require('kernel').marshal.db.samples;
const {BaseTransaction} = require('cryptography').transactions.base;
const {TransactionTokenCurrencyTypeEnum} = require('cryptography').transactions;

module.exports =  class MemPool {

    constructor(scope){

        this._scope = scope;

        this._init = false;
    }

    _resetMemPool(){

        /**
         * Map of all txs
         */
        this.transactions = {};
        this._transactionsInsertingPromises = {};

        /*
         * Map by all Vin0
         * It contains an array with the sorted transactions by nonce
         */
        this.transactionsOrderedByVin0Nonce = {}; //Map of Arrays

        /**
         *  Map by all PublicKeyHash
         *  It contains an array with all transactions
         */
        this.transactionsByPublicKeyHash = {}; //Map of Arrays

        /**
         * All Tx
         */
        this.transactionsArray = [];

        this.queuedTxs = {};
        this.queuedTxsArray = [];

    }

    async load(){

        this._resetMemPool();

    }

    async clearMemPool(){

        this._resetMemPool();

    }

    async initializeMemPool(){

        if (this._init) return true;

        if (this._scope.argv.testnet.createNewTestNet )
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMaster)
                await this.clearMemPool();

        if ( this._scope.db.isSynchronized ) {

            this._scope.masterCluster.on("mem-pool", async data =>{

                try {

                    if (data.message === "mem-pool-insert-tx"){
                        if (!this.transactions[data.txIdHex])
                            await this._insertTransactionInMemPool( data.txId, data.tx,  false, false, true, data.propagateToSockets, data.awaitPropagate, [], data._workerIndex );
                    }else
                    if (data.message === "mem-pool-propagate-tx-sockets"){
                        if (this.transactions[data.txIdHex])
                            await this._propagateTransactionInMemPool(data.txId, data.awaitPropagate);
                    }else
                    if (data.message === "mem-pool-remove-tx"){
                        if (this.transactions[data.txIdHex])
                            await this._removeTransactionFromMemPool(data.txId, false);
                    }

                }
                catch(err){
                    this._scope.logger.error(this, "Mem Pool subscription raised an error", err);
                }

            });


        }

        this._init = true;
        return true;
    }

    async newTransaction( txId, transaction, cloneTx, propagateToMasterCluster, preValidateTx, awaitPropagate, senderSockets ){

        try{

            if (cloneTx)
                transaction = this._scope.mainChain.transactionsValidator.cloneTx(transaction);

            //don't clone it as it was already cloned above
            await this._insertTransactionInMemPool( txId, transaction, propagateToMasterCluster, true, preValidateTx, true, awaitPropagate, senderSockets );

            return transaction;

        }catch(err){
            this._scope.logger.error(this, "Error adding transaction to mem pool", err);
        }

    }

    getMemPoolTransaction(txIdHex){

        if ( Buffer.isBuffer(txIdHex) ) txIdHex = txIdHex.toString("hex");
        return this.transactions[txIdHex];

    }

    getMemPoolPendingBalance(publicKeyHash, tokenCurrency ){

        if (tokenCurrency)
            if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency)) tokenCurrency = Buffer.from(tokenCurrency, "hex");

        const out = {};

        for (const vin0PublicKeyHash in this.transactionsOrderedByVin0Nonce) {

            const array = this.transactionsOrderedByVin0Nonce[vin0PublicKeyHash];
            for (const tx of array) {

                for (const vin of tx.vin)
                    if (  vin.publicKeyHash && vin.publicKeyHash.equals(publicKeyHash) && ( !tokenCurrency || vin.tokenCurrency.equals(tokenCurrency) ) )
                        out[ vin.tokenCurrency.toString('hex') ] =  (out[ vin.tokenCurrency.toString('hex') ] || 0) - vin.amount;

                for (const vout of tx.vout)
                    if (vout.publicKeyHash && vout.publicKeyHash.equals(publicKeyHash) && ( !tokenCurrency || vout.tokenCurrency.equals(tokenCurrency) ) )
                        out[ vout.tokenCurrency.toString('hex') ] =  (out[ vout.tokenCurrency.toString('hex') ] || 0) + vout.amount;

            }

        }

        return out;

    }
    
    getMemPoolTransactionNonce( publicKeyHash, accountNonce = 0){

        if (Buffer.isBuffer(publicKeyHash)) publicKeyHash = publicKeyHash.toString("hex");

        const array = this.transactionsOrderedByVin0Nonce[publicKeyHash] || [] ;

        if (array.length)
            return array[array.length-1].nonce+1;
        else
            return accountNonce;

    }

    async _includeTransaction(chain = this._scope.mainChain, chainData = chain.data, transactions, block, tx){

        try{

            const out1 = await tx.validateTransaction( chain, chainData, block);
            if (!out1) throw new Exception(this, "validateTransaction failed");

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Including Tx raised an error", err);

            return false;
        }

        try{

            const out2 = await tx.transactionAdded( chain, chainData, block, transactions.length );
            if (!out2) throw new Exception(this, "transactionAdded failed");


        }catch(err){

            this._scope.logger.error(this, "Including Tx 2 raised a strange error", err);

            return false
        }

        transactions.push(tx);
        return true;
    }

    //block.ChainData is being locked already
    async includeTransactions( block, createTransactionsCallback, chain = block._scope.chain, chainData = chain.data ){

        /**
         * TODO order the transactions to be sorted
         */

        const transactions = [  ];

        for (const vin0PublicKeyHash in this.transactionsOrderedByVin0Nonce){

            const array = this.transactionsOrderedByVin0Nonce[vin0PublicKeyHash];

            let nonce =  ( await chainData.accountHashMap.getNonce( vin0PublicKeyHash ) ) || 0;

            const nonces = [];
            for (const tx of array)
                nonces.push(tx.nonce  );
            this._scope.logger.log(this, "nonces", { nonces, nonce} );

            for (let i=0; i < array.length; i++) {

                const tx = array[i];

                if (tx.nonce < nonce){
                    console.log("delete tx.nonce", tx.nonce, nonce);
                    await this._removeTransactionFromMemPool( tx.hash(), true );
                    if (array[i] !== tx) i--;
                }
                else if (tx.nonce === nonce) { //real tx and not only reserved nonce
                    const out = await this._includeTransaction(block._scope.chain, chainData, transactions, block, tx);
                    if ( !out ){
                        this._scope.logger.warn(this, "Include Transaction didn't match ", {nonce: nonce, txNonce: tx.nonce, out } );
                        break;
                    }
                    nonce = nonce + 1;
                }
                else break;
            }

        }

        if (createTransactionsCallback)
            await createTransactionsCallback(block, async ( tx )=>{

                await this._includeTransaction(block._scope.chain, chainData, transactions, block, tx);

            });

        //no need to remove the transactions as a temporary chainData was used

        const queuedTxs = {};
        transactions.map (tx => queuedTxs[tx.hash().toString("hex")] = tx );

        this.queuedTxs = queuedTxs;
        this.queuedTxsArray = transactions;

        await block.transactionsMerkleTree.fillTransactions( transactions );

        return transactions;

    }

    async updateMemPoolWithMainChainChanges(blocksAdded, blocksRemoved){

        //removing txs from the mem pool
        const txAlreadyIncluded = {};
        for (const block of blocksAdded) {
            const leavesNonPruned = await block.transactionsMerkleTree.leavesNonPruned();
            for (const it of leavesNonPruned) {
                txAlreadyIncluded[it.transaction.hash().toString('hex')] = true;
                await this.onTransactionIncludedMainChain(it.transaction, block);
            }
        }

        for (const blockRemoved of blocksRemoved) {
            const leavesNonPruned = await blockRemoved.transactionsMerkleTree.leavesNonPruned();
            for (const it of leavesNonPruned)
                if ( !txAlreadyIncluded[ it.transaction.hash().toString('hex') ] )
                    await this.onTransactionRemovedMainChain(it.transaction, blockRemoved);
        }
    }

    onTransactionIncludedMainChain(transaction){
        return this._removeTransactionFromMemPool(transaction.hash(), transaction, true, );
    }

    onTransactionRemovedMainChain(transaction){
        return this._insertTransactionInMemPool( transaction.hash(), transaction,  true, false, false, false );
    }

    async reload(){

        try{
            await this.load();
        }catch(err){

        }

    }

    async _insertTransactionInMemPool( txId, transaction,  propagateToMasterCluster = true, validateTxOnce = false, preValidateTx = true, propagateToSockets=true, awaitPropagate = true, senderSockets, workerIndex ){

        if (this.transactionsArray.length >= this._scope.argv.memPool.maximumMemPool) return false;

        if (typeof txId === "string" ){
            if ( !StringHelper.isHex(txId) || txId.length !== 64 ) throw new Exception(this, 'TxId length is invalid or is not hex');
            txId = Buffer.from(txId, 'hex');
        }
        if ( !Buffer.isBuffer(txId) || txId.length !== 32) throw new Exception(this, 'TxId is invalid');
        const txIdHex = txId.toString("hex");

        if (this.transactions[ txIdHex ]) return false;
        if (this._transactionsInsertingPromises[txIdHex]) return this._transactionsInsertingPromises[txIdHex].promise;

        let answer;
        const promise = new Promise( (resolve, reject)=>{
            answer = { resolve, reject }
        });
        answer.promise = promise;
        this._transactionsInsertingPromises[txIdHex] = answer;

        try{

            if ( !this._scope.mainChain.transactionsValidator.isReallyATx( transaction ) )
                transaction = this._scope.mainChain.transactionsValidator.cloneTx(transaction);

            if (!transaction.hash().equals(txId)) throw new Exception(this, 'Transaction.hash is not matching txId');

            if (validateTxOnce)
                if ( await transaction.validateTransactionOnce(this._scope.mainChain) !== true) throw new Exception(this, "Signatures returned false");

            if (preValidateTx)
                if ( await transaction.preValidateTransaction(this._scope.mainChain) !== true) throw new Exception(this, "Transaction validation failed");

            /**
             * Let's update transactionsOrderedByVin0Nonce
             */

            const vinPublicKeyHashVin = transaction.getVinPublicKeyHash ? transaction.getVinPublicKeyHash.toString('hex') : undefined;

            if (preValidateTx) {

                for (const vin of transaction.vin) {

                    const balance = (await this._scope.mainChain.data.accountHashMap.getBalance(vin.publicKeyHash, vin.tokenCurrency)) || 0;
                    const memPoolBalance = this.getMemPoolPendingBalance(vin.publicKeyHash, vin.tokenCurrency)[vin.tokenCurrency.toString('hex')] || 0;
                    if (balance - vin.amount + memPoolBalance < 0)
                        throw new Exception(this, "Vin balance is exceeding", {balance, vin: vin.amount, memPoolBalance});

                }


                if (vinPublicKeyHashVin){
                    const nonce = await this._scope.mainChain.data.accountHashMap.getNonce(vinPublicKeyHashVin);
                    const memPoolNonce = this.getMemPoolTransactionNonce(vinPublicKeyHashVin, nonce);
                    if (transaction.nonce !== memPoolNonce)
                        throw new Exception(this, "Nonce mem pool is wrong", {txNonce: transaction.nonce, nonce, memPoolNonce, txIdHex });
                }
            }

            this.transactions[txIdHex] = transaction;

            if (vinPublicKeyHashVin) {
                if (!this.transactionsOrderedByVin0Nonce[vinPublicKeyHashVin]) this.transactionsOrderedByVin0Nonce[vinPublicKeyHashVin] = [];
                ArrayHelper.addSortedArray(transaction, this.transactionsOrderedByVin0Nonce[vinPublicKeyHashVin], (a, b) => a.nonce - b.nonce);

            }

            //save transactionsByPublicKeyHash
            const inputsOutputs = transaction.vin.concat(transaction.vout);
            for (const input of inputsOutputs){

                const publicKeyHash = input.publicKeyHash.toString("hex");
                if (!this.transactionsByPublicKeyHash[publicKeyHash]) this.transactionsByPublicKeyHash[publicKeyHash] = [];
                this.transactionsByPublicKeyHash[publicKeyHash].push(transaction);
            }

            this.transactionsArray.push(transaction);

            /**
             * Let's insert the tx in transactionsData
             */

            if (propagateToSockets)
                await this._propagateTransactionInMemPool(txId, awaitPropagate, senderSockets);

            if (propagateToMasterCluster && this._scope.db.isSynchronized ) {

                await this._scope.masterCluster.sendMessage( "mem-pool", {
                    message: "mem-pool-insert-tx",
                    tx: transaction.toBuffer(),
                    txId, txIdHex,
                    propagateToSockets: false,
                }, true, false );

                if (propagateToSockets)
                    await this._scope.masterCluster.sendMessage( "mem-pool", {
                        message: "mem-pool-propagate-tx-sockets",
                        txId, txIdHex,
                        awaitPropagate,
                    }, true, false );

            }

        }catch(err) {
            answer.reject(err);
        }finally{
            answer.resolve(true);
            delete this._transactionsInsertingPromises[txIdHex];
        }
        return answer.promise;
    }

    async _propagateTransactionInMemPool(txId,  awaitPropagate, senderSockets){

        const txIdHex = txId.toString('hex');
        if (!this.transactions[ txIdHex ]) return false;

        this._scope.logger.warn(this, "Transaction Propagate to Mem Pool sockets", { txId })
        const out = this._scope.masterCluster.broadcastToSocketsAsync("mem-pool/new-tx-id", {txId}, undefined, senderSockets);

        if (awaitPropagate)
            await out;

    }

    async _removeTransactionFromMemPool(txId, propagateToMasterCluster = true){

        if (typeof txId === "string" ){
            if ( !StringHelper.isHex(txId) || txId.length !== 64 ) throw new Exception(this, 'TxId length is invalid or is not hex');
            txId = Buffer.from(txId, 'hex');
        }
        if ( !Buffer.isBuffer(txId) || txId.length !== 32) throw new Exception(this, 'TxId is invalid');
        const txIdHex = txId.toString("hex");

        const transaction = this.transactions[txIdHex];
        if ( !transaction ) return false;

        if (!transaction.hash().equals(txId)) throw new Exception(this, 'transaction is invalid');

        delete this.transactions[txIdHex];

        //save transactionsByPublicKeyHash
        const inputs = transaction.vin.concat(transaction.vout);
        for (const input of inputs){

            const publicKeyHash = input.publicKeyHash.toString("hex");
            const array = this.transactionsByPublicKeyHash[publicKeyHash];
            for (let i = array.length-1; i >= 0; i--)
                if (array[i].hash().equals(txId)) {
                    array.splice(i, 1);
                    break;
                }

            if (array.length === 0) delete this.transactionsByPublicKeyHash[publicKeyHash];
        }

        //delete txData

        const publicKeyHashVin = transaction.vin[0].publicKeyHash.toString("hex");
        const array = this.transactionsOrderedByVin0Nonce[ publicKeyHashVin ] || [];
        for (let i=array.length-1; i >= 0 ; i--)
            if (array[i] === transaction || array[i].hash().equals( txId ) ) {
                array.splice(i, 1);
                break;
            }
        if (array.length === 0)
            delete this.transactionsOrderedByVin0Nonce[ publicKeyHashVin ];

        for (let i=this.transactionsArray.length-1; i >= 0; i--)
            if (this.transactionsArray[i].hash().equals(txId)){
                this.transactionsArray.splice(i,1);
                break;
            }

        if (propagateToMasterCluster && this._scope.db.isSynchronized )
            await this._scope.masterCluster.sendMessage( "mem-pool", {
                message: "mem-pool-remove-tx",
                txId, txIdHex
            }, true, false );

        await this._scope.mainChain.emit("mem-pool/tx-removed", {
            data: { tx: transaction, txId, txIdHex},
        });

        return true;
    }
}