
const {TransactionTypeEnum, TransactionScriptTypeEnum} = global.cryptography.transactions;
const {BaseTransaction} = global.cryptography.transactions.base;

const {Exception, EnumHelper, StringHelper, BufferHelper} = global.kernel.helpers;

import BlockchainSimpleTransaction from "src/transactions/simple-transaction/blockchain-simple-transaction"

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