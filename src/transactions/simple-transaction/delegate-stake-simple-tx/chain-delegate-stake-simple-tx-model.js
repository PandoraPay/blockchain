const {Helper, Exception} = PandoraLibrary.helpers;

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

        if ( this.delegate.delegateStakeNonce < delegate.delegateStakeNonce   ) throw new Exception(this, "Delegate.delegateStakeNonce should be greater or equal with the previous value");
        if ( this.delegate.delegateStakeNonce > delegate.delegateStakeNonce+1   ) throw new Exception(this, "Delegate.delegateStakeNonce shouldn't that much big");

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        const prevDelegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash  );
        const prevDelegateNonce = prevDelegate ? prevDelegate.delegateStakeNonce : 0;
        await chainData.accountHashMap.updateDelegate( this.vin[0].publicKeyHash, this.delegate.delegateStakeNonce - prevDelegateNonce, this.delegate.delegateStakePublicKey, this.delegate.delegateStakeFee );

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){
        return super.transactionRemoved(chain, chainData);
    }

    async getTransactionRevertInfoPreviousState(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        const delegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash );
        return {
            delegateStakeNonce: delegate.delegateStakeNonce,
            delegateStakePublicKey: delegate.delegateStakePublicKey.toString('hex'),
            delegateStakeFee: delegate.delegateStakeFee,
        };
    }

    async processTransactionRevertInfoPreviousState( revertInfoData, chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight ){

        const prevDelegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash  );
        const prevDelegateNonce = prevDelegate ? prevDelegate.delegateStakeNonce : 0;

        await chainData.accountHashMap.updateDelegate( this.vin[0].publicKeyHash, revertInfoData.delegateStakeNonce - prevDelegateNonce, Buffer.from(revertInfoData.delegateStakePublicKey, 'hex'), revertInfoData.delegateStakeFee );

    }

}