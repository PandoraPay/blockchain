
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
                    minSize: 0,
                    maxSize: 1,
                },

                tokenCurrency: {

                    default: Buffer.from(TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id, "hex"),

                    validation(value) {

                        const tokenCurrencyString = value.toString("hex");
                        return tokenCurrencyString === TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id;
                    },
                },

                vout:{
                    minSize: 0,
                    maxSize: 0,
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

}