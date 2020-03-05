const {Exception} = global.kernel.helpers;
const {TransactionTypeEnum} = global.cryptography.transactions;

import BlockchainSimpleTransaction from "./../simple-transaction/blockchain-simple-transaction"
import BlockchainDelegateStakeSimpleTransaction from "./../delegate-stake-simple-transaction/blockchain-delegate-stake-simple-transaction"
import BlockchainTokenCreateSimpleTransaction from  "./../token-create-simple-transaction/blockchain-token-create-simple-transaction"

export default class TransactionsCreator {
    
    constructor(scope){
        this._scope = scope;
    }

    async createSimpleTransaction( { vin, vout, privateKeys, nonce, tokenCurrency }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (vout && !Array.isArray(vout)) vout = [vout];

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
            tx.nonce = nonce;
        }

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

    async createDelegateSimpleTransaction( { vin, privateKeys, nonce, delegateOld, delegate }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];

        if (vin.length === 0) throw new Exception(this, "Vin is empty");
        if (vin.length !== 1) throw new Exception(this, "Vin needs to have exactly one element");

        const input = [...vin];
        input.map( it => it.signature = Buffer.alloc(65) );

        const tx = new BlockchainDelegateStakeSimpleTransaction( this._scope, undefined, {

            vin: input,
            vout: [],
            nonce,
            delegateOld,
            delegate,

        }, "object" );

        if (nonce === undefined) {
            nonce = await chain.data.accountHashMap.getNonce(tx.vin[0].publicKeyHash);
            nonce = this._scope.memPool.getMemPoolTransactionNonce( tx.vin[0].publicKeyHash,  nonce || 0);
            tx.nonce = nonce;
        }


        if ( !delegateOld ){
            delegateOld = await chain.data.accountHashMap.getDelegate(tx.vin[0].publicKeyHash);
            tx.delegateOld = delegateOld;
        }

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

    async createTokenCreateSimpleTransaction( { vin, privateKeys, nonce, tokenPublicKeyHash, tokenData }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];

        if (vin.length === 0) throw new Exception(this, "Vin is empty");
        if (vin.length !== 1) throw new Exception(this, "Vin needs to have exactly one element");

        const input = [...vin];
        input.map( it => it.signature = Buffer.alloc(65) );

        const tx = new BlockchainTokenCreateSimpleTransaction( this._scope, undefined, {

            vin: input,
            vout: [],
            nonce,
            tokenPublicKeyHash,
            tokenData,

        }, "object" );

        if (nonce === undefined) {
            nonce = await chain.data.accountHashMap.getNonce(tx.vin[0].publicKeyHash);
            nonce = this._scope.memPool.getMemPoolTransactionNonce( tx.vin[0].publicKeyHash,  nonce || 0);
            tx.nonce = nonce;
        }

        if (!tokenPublicKeyHash){
            tokenPublicKeyHash = this._scope.cryptography.addressGenerator.generateContractPublicKeyHashFromAccountPublicKeyHash( tx.vin[0].publicKeyHash, nonce );
            console.log("tokenPublicKeyHash", tokenPublicKeyHash);
            tx.tokenPublicKeyHash = tokenPublicKeyHash;
        }

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

}