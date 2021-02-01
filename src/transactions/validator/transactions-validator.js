
const {TransactionTypeEnum, TransactionScriptTypeEnum} = require('cryptography').transactions;
const {BaseTransaction} = require('cryptography').transactions.base;

const {Exception, EnumHelper, StringHelper, BufferHelper} = require('kernel').helpers;

const BlockchainSimpleTransactionDBModel = require( "../simple-transaction/blockchain-simple-transaction-db-model")
const BlockchainDelegateStakeSimpleTransaction = require( "../simple-transaction/delegate-stake-simple-transaction/blockchain-delegate-stake-simple-transaction-db-model")
const BlockchainTokenCreateSimpleTransactionDBModel = require( "../tokens/token-create/blockchain-token-create-simple-transaction-db-model")
const BlockchainTokenUpdateSupplySimpleTransactionDBModel = require( "../tokens/token-update-supply/blockchain-token-update-supply-simple-transaction-db-model")

module.exports = class TransactionsValidator{
    
    constructor(scope){
        this._scope = scope;
    }
    
    validateTxVersion(version){
        
        if (EnumHelper.validateEnum( version , TransactionTypeEnum) ) return true;

    }
    
    validateTxScript(scriptVersion){
        if (EnumHelper.validateEnum( version , TransactionScriptTypeEnum) ) return true;
    }

    isReallyATx(tx){

        if (tx && tx instanceof BlockchainSimpleTransaction) return true;

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
        if ( scriptVersion === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_CREATE_TRANSACTION ) return BlockchainTokenCreateSimpleTransaction;
        if ( scriptVersion === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION ) return BlockchainTokenUpdateSupplySimpleTransaction;

        throw new Exception(this, "Transaction class couldn't be identified by script version", scriptVersion);
            
    }

    validateTx(input){

        const transactionClass = this.getTxClass( input );

        if (input instanceof transactionClass) return input;
        else return new transactionClass( this._scope, undefined, input  );

    }

    cloneTx(input){
        return this.validateTx(input);
    }
    
}