
const {SimpleTransaction} = global.cryptography.transactions.simpleTransaction;
const {Helper, Exception} = global.kernel.helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

import BlockchainSimpleTransaction from "./../simple-transaction/blockchain-simple-transaction"
import AccountHashMapDataDelegate from "../../chain/maps/account-hash/data/account-hash-map-data-delegate";

export default class BlockchainDelegateStakeSimpleTransaction extends BlockchainSimpleTransaction {

    constructor(scope, schema={}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                scriptVersion:{

                    default: TransactionScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION,

                    validation(script){
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION;
                    }
                },

                vin:{
                    minSize: 1,
                    maxSize: 1,
                    fixedBytes: 1,
                    specifyLength: false,
                },

                tokenCurrency: {

                    default: TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer,

                    validation(value) {
                        return value.equals( TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer );
                    },
                },

                vout:{
                    minSize: 0,
                    maxSize: 0,
                    fixedBytes: 0,
                    specifyLength: false,
                    emptyAllowed: true,
                },

                delegateOld:{
                    type: "object",
                    classObject: AccountHashMapDataDelegate,

                    position: 2000,
                },

                delegate: {
                    type: "object",
                    classObject: AccountHashMapDataDelegate,

                    position: 2001,
                },

            }

        }, schema, false), data, type, creationOptions);

    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        const out = await super.validateTransaction(chain, chainData, block);
        if (!out) return false;

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );

        const delegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash );
        if (!delegate) throw new Exception(this, "delegate doesn't exist");

        if (delegate.delegateNonce !== this.delegateOld.delegateNonce ) throw new Exception(this, "delegateOld.delegateNonce is not matching" );
        if ( !delegate.delegatePublicKey.equals( this.delegateOld.delegatePublicKey) ) throw new Exception(this, "delegateOld.delegatePublickey is not matching" );
        if ( delegate.delegateFee !== this.delegateOld.delegateFee ) throw new Exception(this, "delegateOld.delegateFee is not matching" );

        if ( this.delegate.delegateNonce < delegate.delegateNonce   ) throw new Exception(this, "Delegate.delegateNonce should be greater or equal with the previous value");
        if ( this.delegate.delegateNonce > delegate.delegateNonce+1   ) throw new Exception(this, "Delegate.delegateNonce shouldn't that much big");

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        const prevDelegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash  );
        const prevDelegateNonce = prevDelegate ? prevDelegate.delegateNonce : 0;
        await chainData.accountHashMap.updateDelegate( this.vin[0].publicKeyHash, this.delegate.delegateNonce - prevDelegateNonce, this.delegate.delegatePublicKey, this.delegate.delegateFee );

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        const prevDelegate = await chainData.accountHashMap.getDelegate( this.vin[0].publicKeyHash  );
        const prevDelegateNonce = prevDelegate ? prevDelegate.delegateNonce : 0;

        await chainData.accountHashMap.updateDelegate( this.vin[0].publicKeyHash, prevDelegateNonce - this.delegateOld.delegateNonce, this.delegateOld.delegatePublicKey, this.delegateOld.delegateFee );

        return super.transactionRemoved(chain, chainData);

    }

}