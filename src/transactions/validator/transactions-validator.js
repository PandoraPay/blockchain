
const {TxTypeEnum, TxScriptTypeEnum} = require('cryptography').transactions;
const {BaseTxModel} = require('cryptography').transactions.baseTransaction;
const {MarshalData} = require('kernel').marshal;

const {BufferReader, Exception, EnumHelper, StringHelper, BufferHelper} = require('kernel').helpers;

const ChainSimpleTxModel = require( "../simple-transaction/chain-simple-tx-model")
const ChainDelegateStakeSimpleTxModel = require( "../simple-transaction/delegate-stake-simple-tx/chain-delegate-stake-simple-tx-model")
const ChainTokenCreateSimpleTxModel = require( "../tokens/token-create/chain-token-create-simple-tx-model")
const ChainTokenUpdateSupplySimpleTxModel = require( "../tokens/token-update-supply/chain-token-update-supply-simple-tx-model")

module.exports = class TransactionsValidator{
    
    constructor(scope){
        this._scope = scope;
    }
    
    validateTxVersion(version){
        return EnumHelper.validateEnum( version , TxTypeEnum);
    }
    
    validateTxScript(scriptVersion){
        return EnumHelper.validateEnum( scriptVersion , TxScriptTypeEnum);
    }

    isReallyATx(tx){
        return (tx && tx instanceof ChainSimpleTxModel);
    }

    getTxClass(input){

        if (typeof input === "string" && StringHelper.isHex(input)) input = Buffer.from(input, "hex");

        let scriptVersion;

        if (Buffer.isBuffer(input )) scriptVersion = MarshalData.unmarshalNumber( BufferReader.create(input) );
        else if ( input instanceof BaseTxModel) scriptVersion = input.scriptVersion;
        else if ( typeof input === "object" ) scriptVersion = input.scriptVersion;
        else throw "invalid data type";

        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_SIMPLE_TRANSACTION ) return ChainSimpleTxModel;
        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION ) return ChainDelegateStakeSimpleTxModel;
        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_TOKEN_CREATE_TRANSACTION ) return ChainTokenCreateSimpleTxModel;
        if ( scriptVersion === TxScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION ) return ChainTokenUpdateSupplySimpleTxModel;

        throw new Exception(this, "Transaction class couldn't be identified by script version", scriptVersion);
            
    }

    cloneTx(input){
        const transactionClass = this.getTxClass( input );
        return new transactionClass( this._scope, undefined, input  );
    }
    
}