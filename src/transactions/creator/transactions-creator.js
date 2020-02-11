const {Exception} = global.kernel.helpers;
const {TransactionTypeEnum} = global.cryptography.transactions;

import BlockchainSimpleTransaction from "src/transactions/simple-transaction/blockchain-simple-transaction"

export default class TransactionsCreator {
    
    constructor(scope){
        this._scope = scope;
    }

    async createSimpleTransaction( { vin, vout, privateKeys, nonce, tokenCurrency }, chain = this._scope.chain ){

        if (!Array.isArray(vin)) vin = [vin];
        if (!Array.isArray(vout)) vout = [vout];

        if (vin.length === 0) throw new Exception(this, "Vin is empty");

        const input = [...vin];
        input.map( it => it.signature = Buffer.alloc(65) );

        const tx = new BlockchainSimpleTransaction( this._scope, undefined, {

            vin: input,
            vout,
            nonce,
            tokenCurrency,

        }, "object" );

        if (nonce === undefined) {
            nonce = await chain.data.accountHashMap.getNonce(tx.vin[0].publicKeyHash);
            nonce = this._scope.memPool.getMemPoolTransactionNonce( tx.vin[0].publicKeyHash,  nonce || 0);
        }

        tx.nonce = nonce;

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

}