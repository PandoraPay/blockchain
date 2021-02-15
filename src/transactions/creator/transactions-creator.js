const {Exception} = require('kernel').helpers;
const {TxTypeEnum} = require('cryptography').transactions;

const ChainSimpleTxModel = require( "../simple-transaction/chain-simple-tx-model")
const ChainDelegateStakeSimpleTxModel = require( "../simple-transaction/delegate-stake-simple-tx/chain-delegate-stake-simple-tx-model")
const ChainTokenCreateSimpleTxModel = require(  "../tokens/token-create/chain-token-create-simple-tx-model")
const ChainTokenUpdateSupplySimpleTxModel = require(  "../tokens/token-update-supply/chain-token-update-supply-simple-tx-model")

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

    async createSimpleTransaction( { vin, vout, privateKeys, extra, nonce }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (vout && !Array.isArray(vout)) vout = [vout];

        if (!vin || !vin.length ) throw new Exception(this, "Vin is empty");
        if (!vout || !vout.length  ) throw new Exception(this, "Vout is empty");

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new ChainSimpleTxModel( this._scope, undefined, {
            vin: input,
            vout,
            extra,
            nonce,
        }, "object" );

        nonce = await this._calculateNonce(chain, nonce, tx);

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

    async createDelegateSimpleTransaction( { vin, privateKeys, extra, nonce, delegate }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (!vin || vin.length !== 1 ) throw new Exception(this, "Vin length needs to be 1");

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new ChainDelegateStakeSimpleTxModel ( this._scope, undefined, {
            vin: input,
            vout: [],
            extra,
            nonce,
            delegate
        }, "object" );

        nonce = await this._calculateNonce(chain, nonce, tx);

        const signatures = tx.signTransaction(privateKeys);

        return {
            tx,
            signatures,
        }

    }

    async createTokenCreateSimpleTransaction( { vin, privateKeys, extra, nonce, tokenPublicKeyHash, tokenData }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (!vin || vin.length !== 1 ) throw new Exception(this, "Vin length needs to be 1");

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new ChainTokenCreateSimpleTxModel( this._scope, undefined, {

            vin: input,
            vout: [],
            extra,
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

    async createTokenUpdateSupplySimpleTransaction( { vin, privateKeys, extra, nonce, tokenPublicKeyHash, supplySign, supplyValue }, chain = this._scope.chain ){

        if (vin && !Array.isArray(vin)) vin = [vin];
        if (!vin || vin.length !== 1 ) throw new Exception(this, "Vin length needs to be 1");

        if (!supplyValue) throw new Exception(this, 'SupplyValue needs to be provided');

        const input = vin.map( it => { it.signature = Buffer.alloc(65); return it} );

        const tx = new ChainTokenUpdateSupplySimpleTxModel( this._scope, undefined, {

            vin: input,
            vout: [],
            extra,
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