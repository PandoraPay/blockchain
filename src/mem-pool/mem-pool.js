const {Helper, Exception, StringHelper, ArrayHelper} = global.kernel.helpers;
const {DBSchema} = global.kernel.marshal.db;
const {DBSchemaBufferBig, DBSchemaString} = global.kernel.marshal.db.samples;
const {BaseTransaction} = global.cryptography.transactions.base;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

import MemPoolTxData from "./data/mem-pool-tx-data";

export default  class MemPool {

    constructor(scope){

        this._scope = scope;

        this.dataSubscription = new DBSchema(this._scope, { fields: {  table: { default: "memPool", fixedBytes: 7 } }});

        this._init = false;
    }

    _reset(){

        /**
         * Map of all txs
         */
        this.transactions = {};

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

        const out = await this._scope.db.scan( MemPoolTxData, 0, this._scope.argv.memPool.maximumMemPool, '', '', undefined );

        this._reset();

        for (const txData of out)
            await this.newTransaction(txData, false, false,);

    }

    async clear(){

        const out = await this._scope.db.scan( MemPoolTxData, 0, this._scope.argv.memPool.maximumMemPool, '', '', undefined );
        for (const txData of out)
            await txData.delete();

        this._reset();
    }

    async initializeMemPool(){

        if (this._init) return true;

        if (this._scope.argv.testnet.createNewTestNet )
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMasterCluster) {

                await this.clear();

            }

        if ( this._scope.db.isSynchronized ) {

            await this.dataSubscription.subscribe();

            this.dataSubscription.subscription.on( async message => {

                try{

                    //this._scope.logger.info(this, "subscription", message.name);

                    if (message.name === "mem-pool-insert-tx"){

                        if (!this.transactions[ message.data.txId ])
                            await this._insertTransactionInMemPool(message.data.tx, false, false, false, true);
                    }
                    else if (message.name === "mem-pool-remove-tx"){

                        if (this.transactions[ message.data.txId ])
                            await this._removeTransactionFromMemPool(message.data.tx, false);

                    }

                    // else if (message.name === "mem-pool-block-added-included-tx"){
                    //
                    //     const tx = this._scope.mainChain.transactionsValidator.cloneTx( message.data.tx );
                    //     const {txIdString, blockHeight} = message.data;
                    //
                    //     if (!this.transactions[ txIdString ])
                    //         await this._insertTransactionInMemPool(message.data.tx, true, false);
                    //
                    //     this.transactions[ txIdString ]._memPoolIncluded = true;
                    // }
                    // else if (message.name === "mem-pool-block-removed-removed-tx"){
                    //
                    //     const tx = this._scope.mainChain.transactionsValidator.cloneTx( message.data.tx );
                    //     const txId = message.data.txId;
                    //
                    //     if (!this.transactions[ txId ])
                    //         await this._insertTransactionInMemPool( tx, false, false);
                    //
                    //     delete this.transactions[ txId ]._memPoolIncluded;
                    //
                    // }


                }catch(err){

                    if (err instanceof Exception && err.message !== "Hash already found")
                        this._scope.logger.error(this, "Mem Pool raised an error", err);

                }

            });

        }

        this._init = true;
        return true;
    }

    async newTransaction(transaction, propagateTxMasterCluster, preValidateTx, senderSockets ){

        try{

            await this._insertTransactionInMemPool(transaction, true, propagateTxMasterCluster, true, preValidateTx, true, senderSockets ); //don't clone it as it was already cloned above

            return transaction;

        }catch(err){
            this._scope.logger.error(this, "Error adding transaction to mem pool", err);
        }

    }

    getMemPoolTransaction(txId){

        if ( Buffer.isBuffer(txId) ) txId = txId.toString("hex");
        return this.transactions[txId];

    }

    getMemPoolPendingBalance(publicKeyHash, tokenCurrency ){

        if (tokenCurrency)
            if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency)) tokenCurrency = Buffer.from(tokenCurrency, "hex");

        const out = {};

        for (const vin0PublicKeyHash in this.transactionsOrderedByVin0Nonce) {

            const array = this.transactionsOrderedByVin0Nonce[vin0PublicKeyHash];
            for (const tx of array) {

                if ( tx._memPoolIncluded ) continue;

                for (const vin of tx.vin)
                    if (  vin.publicKeyHash.equals(publicKeyHash) && ( !tokenCurrency || vin.tokenCurrency.equals(tokenCurrency) ) )
                        out[ vin.tokenCurrency.toString('hex') ] =  (out[ vin.tokenCurrency.toString('hex') ] || 0) - vin.amount;

                for (const vout of tx.vout)
                    if (vout.publicKeyHash.equals(publicKeyHash) && ( !tokenCurrency || vout.tokenCurrency.equals(tokenCurrency) ) )
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
                nonces.push(tx.nonce * ( ( tx._memPoolIncluded) ? -1 : 1) );
            this._scope.logger.log(this, "nonces", { nonces, nonce} );

            for (let i=0; i < array.length; i++) {

                const tx = array[i];

                if (tx.nonce < nonce){
                    console.log("delete tx.nonce", tx.nonce, nonce);
                    await this._removeTransactionFromMemPool(tx);
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

                if (!tx._memPoolIncluded)
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

    // async onTransactionIncludedMainChain(transaction, block){
    //
    //     const txIdString = transaction.hash().toString("hex");
    //
    //     if (!this.transactions[ txIdString ])
    //         await this._insertTransactionInMemPool(transaction, true, false);
    //
    //     this.transactions[ txIdString ]._memPoolIncluded = true;
    //
    //     if (this._scope.db.isSynchronized )
    //         await this.subscribeMessage("mem-pool-block-added-included-tx", {
    //             txIdString,
    //             blockHeight: block.height,
    //             tx: transaction.toBuffer(),
    //         }, true, false);
    //
    //
    // }
    //
    // async onTransactionRemovedMainChain(transaction){
    //
    //     const txIdString = transaction.hash().toString("hex");
    //
    //     if (!this.transactions[ txIdString ])
    //         await this._insertTransactionInMemPool(transaction, true, false);
    //
    //     delete this.transactions[ txIdString ]._memPoolIncluded;
    //
    //     if (this._scope.db.isSynchronized )
    //         await this.subscribeMessage("mem-pool-block-removed-removed-tx", {
    //             txIdString,
    //             tx: transaction.toBuffer(),
    //         }, true, false);
    //
    // }

    onTransactionIncludedMainChain(transaction){
        return this._removeTransactionFromMemPool(transaction);
    }

    onTransactionRemovedMainChain(transaction){
        return this._insertTransactionInMemPool(transaction, true, true, false, false, false );
    }

    async reload(){

        try{
            await this.load();
        }catch(err){

        }

    }

    async _insertTransactionInMemPool(transaction, cloneTx = true, propagateTxMasterCluster = true, validateTxOnce = false, preValidateTx = true, propagateToSockets=true, senderSockets){

        if (this.transactionsArray.length >= this._scope.argv.memPool.maximumMemPool) return false;

        let clone = true;

        if ( !this._scope.mainChain.transactionsValidator.isReallyATx( transaction ) ){
            transaction = this._scope.mainChain.transactionsValidator.cloneTx(transaction);
            clone = false;
        }

        const txId = transaction.hash();
        const txIdString = txId.toString("hex");

        if (this.transactions[ txIdString ]) return false;

        if (validateTxOnce)
            if ( await transaction.validateTransactionOnce(this._scope.mainChain) !== true) throw new Exception(this, "Signatures returned false");

        if (preValidateTx)
            if ( await transaction.preValidateTransaction(this._scope.mainChain) !== true) throw new Exception(this, "Transaction validation failed");

        if (cloneTx && !clone)
            transaction = this._scope.mainChain.transactionsValidator.cloneTx( transaction );

        /**
         * Let's update transactionsOrderedByVin0Nonce
         */

        const publicKeyHashVin = transaction.vin[0].publicKeyHash.toString("hex");

        if (preValidateTx) {

            for (const vin of transaction.vin) {

                const balance = (await this._scope.mainChain.data.accountHashMap.getBalance(vin.publicKeyHash, vin.tokenCurrency)) || 0;
                const memPoolBalance = this.getMemPoolPendingBalance(vin.publicKeyHash, vin.tokenCurrency)[vin.tokenCurrency.toString('hex')] || 0;
                if (balance - vin.amount + memPoolBalance < 0)
                    throw new Exception(this, "Vin balance is exceeding", {balance, vin: vin.amount, memPoolBalance});

            }


            const nonce = await this._scope.mainChain.data.accountHashMap.getNonce(transaction.vin[0].publicKeyHash);
            const memPoolNonce = this.getMemPoolTransactionNonce(publicKeyHashVin, nonce);
            if (transaction.nonce !== memPoolNonce)
                throw new Exception(this, "Nonce mem pool is wrong", {txNonce: transaction.nonce, nonce, memPoolNonce});

        }

        if (!this.transactionsOrderedByVin0Nonce[ publicKeyHashVin ]) this.transactionsOrderedByVin0Nonce[ publicKeyHashVin ] = [];

        ArrayHelper.addSortedArray(transaction, this.transactionsOrderedByVin0Nonce[ publicKeyHashVin ], (a,b)=> a.nonce - b.nonce );

        this.transactions[txIdString] = transaction;
        //save transactionsByPublicKeyHash
        const inputs = transaction.vin.concat(transaction.vout);
        for (const input of inputs){
            const publicKeyHash = input.publicKeyHash.toString("hex");
            if (!this.transactionsByPublicKeyHash[publicKeyHash]) this.transactionsByPublicKeyHash[publicKeyHash] = [];
            this.transactionsByPublicKeyHash[publicKeyHash].push(transaction);
        }
        this.transactionsArray.push(transaction);

        /**
         * Let's insert the tx in transactionsData
         */

        if (propagateToSockets)
            await this._scope.mainChain.emit("mem-pool/tx-included", {
                data: { tx: transaction, txId: txIdString},
                senderSockets,
            });

        this._scope.logger.warn(this, "New Transaction", {id: txIdString, nonce: transaction.nonce});

        if (propagateTxMasterCluster && this._scope.db.isSynchronized )
            await this.dataSubscription.subscribeMessage("mem-pool-insert-tx", {
                tx: transaction.toBuffer(),
                txId: txIdString,
            }, true, false);

        return true;
    }

    async _removeTransactionFromMemPool(transaction, propagateTxMasterCluster = true, senderSockets){

        if ( !this._scope.mainChain.transactionsValidator.isReallyATx( transaction ) ) {
            transaction = this._scope.mainChain.transactionsValidator.cloneTx(transaction);
        }

        const txId = transaction.hash();
        const txIdString = transaction.hash().toString("hex");

        if (!this.transactions[txIdString] ) return false;

        delete this.transactions[txIdString];

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

        if (propagateTxMasterCluster && this._scope.db.isSynchronized )
            await this.dataSubscription.subscribeMessage("mem-pool-remove-tx", {
                tx: transaction.toBuffer(),
                txId: txIdString,
            }, true, false);

        await this._scope.mainChain.emit("mem-pool/tx-removed", {
            data: { tx: transaction, txId: txIdString},
            senderSockets,
        });

        return true;
    }
}