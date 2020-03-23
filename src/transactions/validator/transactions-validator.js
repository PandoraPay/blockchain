
const {TransactionTypeEnum, TransactionScriptTypeEnum} = global.cryptography.transactions;
const {BaseTransaction} = global.cryptography.transactions.base;

const {Exception, EnumHelper, StringHelper, BufferHelper} = global.kernel.helpers;
const {DBSchema} = global.kernel.marshal.db;

import BlockchainSimpleTransaction from "./../simple-transaction/blockchain-simple-transaction"
import BlockchainDelegateStakeSimpleTransaction from "./../simple-transaction/delegate-stake-simple-transaction/blockchain-delegate-stake-simple-transaction"
import BlockchainTokenCreateSimpleTransaction from "./../tokens/token-create-simple-transaction/blockchain-token-create-simple-transaction"
import BlockchainTokenUpdateSupplySimpleTransaction from "./../tokens/token-update-supply-simple-transaction/blockchain-token-update-supply-simple-transaction"
import BlockchainZetherDepositSimpleTransaction from "./../simple-transaction/zether/blockchain-zether-deposit-simple-transaction"

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
        if ( scriptVersion === TransactionScriptTypeEnum.TX_SCRIPT_ZETHER_DEPOSIT ) return BlockchainZetherDepositSimpleTransaction;

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