
const {TxTypeEnum, TxScriptTypeEnum} = require('cryptography').transactions;
const {BaseTxModel} = require('cryptography').transactions.baseTransaction;

const {Exception, EnumHelper, StringHelper, BufferHelper} = require('kernel').helpers;

const ChainSimpleTxModel = require( "../simple-transaction/chain-simple-tx-model")
const ChainDelegateStakeSimpleTxModel = require( "../simple-transaction/delegate-stake-simple-tx/chain-delegate-stake-simple-tx-model")
const ChainTokenCreateSimpleTxModel = require( "../tokens/token-create/chain-token-create-simple-tx-model")
const ChainTokenUpdateSupplySimpleTxModel = require( "../tokens/token-update-supply/chain-token-update-supply-simple-tx-model")

module.exports = class TransactionsValidator{
    
    constructor(scope){
        this._scope = scope;
    }
    
    validateTxVersion(version){
        
        if (EnumHelper.validateEnum( version , TxTypeEnum) ) return true;

    }
    
    validateTxScript(scriptVersion){
        if (EnumHelper.validateEnum( scriptVersion , TxScriptTypeEnum) ) return true;
    }

    isReallyATx(tx){

        if (tx && tx instanceof ChainSimpleTxModel) return true;

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
        else if ( input instanceof BaseTxModel) scriptVersion = input.scriptVersion;
        else if ( typeof input === "object" ) scriptVersion = input.scriptVersion;

        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_SIMPLE_TRANSACTION ) return ChainSimpleTxModel;
        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION ) return ChainDelegateStakeSimpleTxModel;
        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_TOKEN_CREATE_TRANSACTION ) return ChainTokenCreateSimpleTxModel;
        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION ) return ChainTokenUpdateSupplySimpleTxModel;

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