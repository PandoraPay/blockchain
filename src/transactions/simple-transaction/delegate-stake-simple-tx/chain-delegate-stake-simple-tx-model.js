const {Helper, Exception} = require('kernel').helpers;
const {TxTypeEnum, TxScriptTypeEnum, TxTokenCurrencyTypeEnum} = require('cryptography').transactions;

const ChainSimpleTxModel = require( "../chain-simple-tx-model")

const {ChainDelegateStakeSimpleTxSchemaBuilt} = require('./chain-delegate-stake-simple-tx-schema-build')

module.exports = class ChainDelegateStakeSimpleTxModel extends ChainSimpleTxModel {

    constructor(scope, schema= ChainDelegateStakeSimpleTxSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        const out = await super.validateTransaction(chain, chainData, block);
        if (!out) return false;

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );

        const delegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash );
        if (!delegate) throw new Exception(this, "delegate doesn't exist");

        if ( this.delegate.delegateNonce < delegate.delegateNonce   ) throw new Exception(this, "Delegate.delegateNonce should be greater or equal with the previous value");
        if ( this.delegate.delegateNonce > delegate.delegateNonce+1   ) throw new Exception(this, "Delegate.delegateNonce shouldn't that much big");

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        const prevDelegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash  );
        const prevDelegateNonce = prevDelegate ? prevDelegate.delegateNonce : 0;
        await chainData.accountHashMap.updateDelegate( this.vin[0].publicKeyHash, this.delegate.delegateNonce - prevDelegateNonce, this.delegate.delegatePublicKeyHash, this.delegate.delegateFee );

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        return super.transactionRemoved(chain, chainData);

    }

    async getTransactionRevertInfoPreviousState(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        const delegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash );
        return {
            delegateNonce: delegate.delegateNonce,
            delegatePublicKeyHash: delegate.delegatePublicKeyHash.toString('hex'),
            delegateFee: delegate.delegateFee,
        };
    }

    async processTransactionRevertInfoPreviousState( revertInfoData, chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight ){

        const prevDelegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash  );
        const prevDelegateNonce = prevDelegate ? prevDelegate.delegateNonce : 0;

        await chainData.accountHashMap.updateDelegate( this.vin[0].publicKeyHash, prevDelegateNonce - revertInfoData.delegateNonce, Buffer.from(revertInfoData.delegatePublicKeyHash, 'hex'), revertInfoData.delegateFee );

    }

}