const {Exception} = require('kernel').helpers;
const {TransactionTypeEnum} = require('cryptography').transactions;

const BlockchainSimpleTransactionDBModel = require( "../simple-transaction/blockchain-simple-transaction-db-model")
const BlockchainDelegateStakeSimpleTransaction = require( "../simple-transaction/delegate-stake-simple-transaction/blockchain-delegate-stake-simple-transaction-db-model")
const BlockchainTokenCreateSimpleTransactionDBModel = require(  "../tokens/token-create/blockchain-token-create-simple-transaction-db-model")
const BlockchainTokenUpdateSupplySimpleTransactionDBModel = require(  "../tokens/token-update-supply/blockchain-token-update-supply-simple-transaction-db-model")

module.exports = class TransactionsCreator {
    
    constructor(scope){
        this._scope = scope;
    }

    async _calculateNonce(chain, nonce, tx){
        if (nonce === undefined) {
            nonce = await chain.data.accountHashMap.getNonce(tx.vin[0].publicKeyHash);
            nonce = this._scope.memPool.getMemPoolTransactionNonce( tx.vin[0].publicKeyHash,  nonce || 0);
            tx.nonce = nonce;
        }
        return nonce;
    }

    async createSimpleTransaction( { vin, vout, privateKeys, nonce }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (vout && !Array.isArray(vout)) vout = [vout];

        if (!vin || !vin.length ) throw new Exception(this, "Vin is empty");
        if (!vout || !vout.length  ) throw new Exception(this, "Vout is empty");

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new BlockchainSimpleTransaction( this._scope, undefined, {

            vin: input,
            vout,
            nonce,

        }, "object" );

        nonce = await this._calculateNonce(chain, nonce, tx);

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

    async createDelegateSimpleTransaction( { vin, privateKeys, nonce, delegate }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (!vin || vin.length !== 1 ) throw new Exception(this, "Vin length needs to be 1");

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new BlockchainDelegateStakeSimpleTransaction( this._scope, undefined, {

            vin: input,
            vout: [],
            nonce,
            delegate,

        }, "object" );

        nonce = await this._calculateNonce(chain, nonce, tx);

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

    async createTokenCreateSimpleTransaction( { vin, privateKeys, nonce, tokenPublicKeyHash, tokenData }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (!vin || vin.length !== 1 ) throw new Exception(this, "Vin length needs to be 1");

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new BlockchainTokenCreateSimpleTransaction( this._scope, undefined, {

            vin: input,
            vout: [],
            nonce,
            tokenPublicKeyHash,
            tokenData,

        }, "object" );

        nonce = await this._calculateNonce(chain, nonce, tx);

        if (!tokenPublicKeyHash){
            tokenPublicKeyHash = this._scope.cryptography.addressGenerator.generateContractPublicKeyHashFromAccountPublicKeyHash( tx.vin[0].publicKeyHash, nonce );
            tx.tokenPublicKeyHash = tokenPublicKeyHash;
        }

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

    async createTokenUpdateSupplySimpleTransaction( { vin, privateKeys, nonce, tokenPublicKeyHash, supplySign, supplyValue }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (!vin || vin.length !== 1 ) throw new Exception(this, "Vin length needs to be 1");

        if (!supplyValue) throw new Exception(this, 'SupplyValue needs to be provided');

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new BlockchainTokenUpdateSupplySimpleTransactionDBModel( this._scope, undefined, {

            vin: input,
            vout: [],
            nonce,
            tokenPublicKeyHash,
            supplySign,
            supplyValue,

        }, "object" );

        nonce = await this._calculateNonce(chain, nonce, tx);

        if (!tokenPublicKeyHash){
            tokenPublicKeyHash = this._scope.cryptography.addressGenerator.generateContractPublicKeyHashFromAccountPublicKeyHash( tx.vin[0].publicKeyHash, nonce );
            tx.tokenPublicKeyHash = tokenPublicKeyHash;
        }

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

}