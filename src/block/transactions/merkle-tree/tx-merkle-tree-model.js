const {MerkleTreeModel} = PandoraLibrary.dataStructures.merkleTree;
const {Helper, Exception} = PandoraLibrary.helpers;
const {BaseTxModel} = PandoraLibrary.transactions.baseTransaction;

const {TxMerkleTreeSchemaBuilt} = require('./schema/tx-merkle-tree-schema-build')
const ChainTokenCreateSimpleTxModel = require( "../../../transactions/tokens/token-create/chain-token-create-simple-tx-model")

module.exports = class TxMerkleTreeModel extends MerkleTreeModel {

    constructor(scope, schema = TxMerkleTreeSchemaBuilt,  data, type, creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    fillTransactions(transactions, chain = this._scope.chain){

        if (!transactions ) return;
        if (!Array.isArray(transactions)) transactions = [transactions];
        if (!transactions.length) return;

        for (let i=0; i < transactions.length; i++)
            if (transactions[i] instanceof BaseTxModel)
                transactions[i] = transactions[i].toBuffer();
            else
                throw new Exception(this, "Transaction input is not ")

        return this.fillMerkleTree(transactions);

    }

    get block(){
        return this._scope.parent;
    }

    async validateMerkleTree(chain = this._scope.chain, chainData = chain.data, block){

        if (super.validateMerkleTree() !== true) throw new Exception(this, "ValidateMerkleTree is false");

        const leavesNonPruned = await this.leavesNonPruned();

        if (leavesNonPruned.length !== this.count ) throw new Exception(this, "Some leafs are pruned");

        /**
         * verify transaction
         */
        for (const leaf of leavesNonPruned)
            if ( !leaf.transaction) throw new Exception(this, "Transaction is invalid");

        const transactionsNonPruned = leavesNonPruned.map( it => it.transaction );

        /**
         * Now lets loop through complete block, matching each tx
         * Detecting any duplicates using txId hash
         */
        const txMap = {};
        for (const tx of transactionsNonPruned){

            const hash = tx.hash().toString("hex");
            if (!hash || txMap[hash])
                throw new Exception(this, "Duplicate Transactions", hash);
            else
                txMap[hash] = true;

        }


        /**
         * Signatures validation can be batched
         */
        const promises = transactionsNonPruned.map( tx => tx.validateTransactionOnce(chain, chainData) );

        const verification = await Promise.all(promises);

        for (const out of verification)
            if (!out) throw new Exception(this, "Invalid signature");

        return true;

    }

    async transactionsMerkleTreeInclude(chain = this._scope.chain, chainData = chain.data, block){

        const leaves = await this.leavesNonPruned();

        /**
         * Verify the transactions
         * This can't be batched anymore
         */

        try{

            for ( let i=0; i < leaves.length; i++)
                if (!leaves[i].pruned) {

                    const tx = leaves[i].transaction;

                    const out = await tx.validateTransaction(chain, chainData, block);
                    if (!out) throw new Exception(this, "Validate Transaction failed");

                    const out2 = await tx.transactionAdded(chain, chainData, block, leaves[i].height, i);
                    if (!out2) throw new Exception(this, "Transaction Added failed");
                }


        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Transactions Merkle Tree Include raised an error including a transaction", err);

            return false;
        }

        return true;

    }

    async transactionsMerkleTreeRemove(chain = this._scope.chain, chainData = chain.data, block ){

        const leaves = await this.leavesNonPruned();

        /**
         * Verify the transactions
         * This can't be batched anymore
         */

        try{

            for (let i = leaves.length-1; i >= 0; i--)
                if (!leaves[i].pruned) {
                    const tx = leaves[i].transaction;
                    await tx.transactionRemoved(chain, chainData, block, leaves[i].height, i);
                }

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Transactions Merkle Tree Remove raised an error including a transaction", err);

            return false;
        }

        return true;

    }

    async transactionsMerkleTreeSuccessfullyAdded(chain = this._scope.chain, chainData = chain.data, block){

        const leavesNonPruned = await this.leavesNonPruned();


        for (const it of leavesNonPruned) {

            await it.transaction.transactionSuccessfullyAdded(chain, chainData, block );

        }


    }

    async transactionsMerkleTreeSuccessfullyRemoved(chain = this._scope.chain, chainData = chain.data, block){

        const leavesNonPruned = await this.leavesNonPruned();

        for (let i = leavesNonPruned.length-1; i >= 0; i--){

            const tx = leavesNonPruned[i].transaction;

            await tx.transactionSuccessfullyRemoved(chain, chainData, block );
        }

    }
    

    async sumFees(){
        
        const fees = {};
        
        const leaves = await this.leavesNonPruned();

        for (const leaf of leaves) {
            const fee = leaf.transaction.fee();
            if (fee)
                fees[fee.tokenCurrency] = (fees[fee.tokenCurrency] || 0 ) + fee.amount;

        }

        return fees;
    }

    txCount(){
        return this.count;
    }

    async newTokensCount(){

        let count = 0;

        const leaves = await this.leavesNonPruned();

        for (const leaf of leaves)
            if (leaf.transaction instanceof ChainTokenCreateSimpleTxModel)
                count += 1;

        return count;
    }

    async txIds(){

        const leavesNonPruned = await this.leavesNonPruned();
        return leavesNonPruned.map( it => it.transaction.hash() );

    }

    async calculateAddressesChanged(addresses){

        const leavesNonPruned = await this.leavesNonPruned();

        for (let i = leavesNonPruned.length-1; i >= 0; i--) {

            const tx = leavesNonPruned[i].transaction;
            await tx.calculateAddressesChanged(addresses);
        }

    }

    async getTransactions(){

        const leavesNonPruned = await this.leavesNonPruned();
        return leavesNonPruned.map( it => it.transaction );

    }

}