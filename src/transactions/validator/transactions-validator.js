
const {TxTypeEnum, TxScriptTypeEnum} = PandoraLibrary.transactions;
const {BaseTxModel} = PandoraLibrary.transactions.baseTransaction;
const {MarshalData} = PandoraLibrary.marshal;

const {BufferReader, Exception, EnumHelper, StringHelper, BufferHelper} = PandoraLibrary.helpers;

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

        let version, scriptVersion;

        if (Buffer.isBuffer(input )) {
            const reader = BufferReader.create(input);
            version = MarshalData.unmarshalNumber( reader ); //version first number
            scriptVersion = MarshalData.unmarshalNumber( reader ); //script version 2nd number
        }
        else if ( input instanceof BaseTxModel || typeof input === "object"  ){
            version = input.version;
            scriptVersion = input.scriptVersion;
        }
        else throw Error("invalid data type");

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