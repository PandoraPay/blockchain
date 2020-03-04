
const {TransactionTypeEnum, TransactionScriptTypeEnum} = global.cryptography.transactions;
const {BaseTransaction} = global.cryptography.transactions.base;

const {Exception, EnumHelper, StringHelper, BufferHelper} = global.kernel.helpers;

import BlockchainSimpleTransaction from "./../simple-transaction/blockchain-simple-transaction"
import BlockchainDelegateStakeSimpleTransaction from "./../delegate-stake-simple-transaction/blockchain-delegate-stake-simple-transaction"
import BlockchainTokenCreatorSimpleTransaction from "./../token-creator-simple-transaction/blockchain-token-creator-simple-transaction"

export default class TransactionsValidator{
    
    constructor(scope){
        this._scope = scope;
    }
    
    validateTxVersion(version){
        
        if (EnumHelper.validateEnum( version , TransactionTypeEnum) ) return true;

    }
    
    validateTxScript(scriptVersion){
        if (EnumHelper.validateEnum( version , TransactionScriptTypeEnum) ) return true;
    }

    isTxReallyATx(tx){

        if (!tx) return false;
        if (tx instanceof BlockchainSimpleTransaction) return true;

        return false;
    }

    getTxClass(input){

        if (typeof input === "string") {

            if (StringHelper.isHex(input))
                input = Buffer.from(input, "hex");
            else
                input = JSON.parse(input);

        }

        let scriptVersion;

        if (Buffer.isBuffer(input )) scriptVersion = input[1];
        else if ( input instanceof BaseTransaction) scriptVersion = input.scriptVersion;
        else if ( typeof input === "object" ) scriptVersion = input.scriptVersion;

        if ( scriptVersion === TransactionScriptTypeEnum.TX_SCRIPT_SIMPLE_TRANSACTION ) return BlockchainSimpleTransaction;
        if ( scriptVersion === TransactionScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION ) return BlockchainDelegateStakeSimpleTransaction;
        if ( scriptVersion === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_CREATOR_TRANSACTION ) return BlockchainTokenCreatorSimpleTransaction;

        throw new Exception(this, "Transaction class couldn't be identified by script version", scriptVersion);
            
    }

    validateTx(input){

        const transactionClass = this.getTxClass( input );
        return new transactionClass( this._scope, undefined, input )

    }

    cloneTx(input){
        return this.validateTx(input);
    }
    
}