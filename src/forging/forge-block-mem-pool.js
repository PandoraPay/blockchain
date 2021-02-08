module.exports = class ForgeBlockMemPool {

    constructor(scope) {
        this._scope = scope;
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
    async includeTransactions( block, chain = block._scope.chain, chainData = chain.data ){

        /**
         * TODO order the transactions by the fee
         */

        this._scope.memPool.queuedTxs = {};
        this._scope.memPool.queuedTxsArray = [];

        const transactions = [ ];

        for (const vin0PublicKeyHash in this._scope.memPool.transactionsOrderedByVin0Nonce){

            if (this._scope.forging.reset) return;
            const array = [ ...this._scope.memPool.transactionsOrderedByVin0Nonce[vin0PublicKeyHash] ];

            let nonce =  ( await chainData.accountHashMap.getNonce( vin0PublicKeyHash ) ) || 0;

            const nonces = [];
            for (const tx of array)
                nonces.push(tx.nonce  );

            this._scope.logger.log(this, "nonces", { nonces, nonce} );

            for (let i=0; i < array.length ; i++) {

                if (this._scope.forging.reset) return;

                const tx = array[i];

                if (tx.nonce < nonce){
                    console.log("delete tx.nonce", tx.nonce, nonce);
                    //await is not necessary to avoid waiting for useless operations in forging
                    this._scope.memPool._removeTransactionFromMemPool( tx.hash(), true );
                }
                else if (tx.nonce === nonce) { //real tx and not only reserved nonce

                    const out = await this._includeTransaction( block._scope.chain, chainData, transactions, block, tx);
                    if ( !out ){
                        this._scope.logger.warn(this, "Include Transaction didn't match", { nonce: nonce, txNonce: tx.nonce, out } );
                        break;
                    }

                    nonce = nonce + 1;
                }
                else break;
            }

        }

        if (this._scope.forging.reset) return;

        //no need to remove the transactions as a temporary chainData was used

        const queuedTxs = {};
        transactions.map (tx => queuedTxs[tx.hash().toString("hex")] = tx );

        this._scope.memPool.queuedTxs = queuedTxs;
        this._scope.memPool.queuedTxsArray = transactions;

        block.transactionsMerkleTree.fillTransactions( transactions );

        return transactions;

    }

}