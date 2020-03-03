
const {SimpleTransaction} = global.cryptography.transactions.simpleTransaction;
const {Helper, Exception} = global.kernel.helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

import BlockchainSimpleTransaction from "./../simple-transaction/blockchain-simple-transaction"
import TokenHashMapData from "../../chain/maps/tokens-hash/data/token-hash-map-data";

export default class BlockchainTokenCreatorSimpleTransaction extends BlockchainSimpleTransaction {

    constructor(scope, schema={}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                scriptVersion:{

                    default: TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_CREATOR_TRANSACTION,

                    validation(script){
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_CREATOR_TRANSACTION;
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

                        const tokenCurrencyString = value.toString("hex");
                        return tokenCurrencyString === TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id;
                    },
                },

                vout:{
                    minSize: 0,
                    maxSize: 0,
                    fixedBytes: 0,
                    specifyLength: false,
                    emptyAllowed: true,
                },

                tokenPublicKeyHash:{
                    type: "buffer",
                    fixedBytes: 20,

                    position: 2000,
                },

                token:{
                    type: "object",
                    classObject: TokenHashMapData,

                    position: 2001,
                }


            }

        }, schema, false), data, type, creationOptions);

    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        const out = await super.validateTransaction(chain, chainData, block);
        if (!out) return false;

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );

        const nonce = await chainData.accountHashMap.getNonce( this.vin[0].publicKeyHash ) || 0;

        const tokenPublicKeyHash = this._scope.cryptography.addressGenerator.generateContractPublicKeyHashFromAccountPublicKeyHash( this.vin[0].publicKeyHash, nonce );
        if ( !tokenPublicKeyHash.equals(this.tokenPublicKeyHash) ) throw new Exception(this, 'tokenPublicKeyHash is not matching');

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        //chainData.tokenHashMap

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        return super.transactionRemoved(chain, chainData);

    }

}