
const {SimpleTransaction} = global.cryptography.transactions.simpleTransaction;
const {Helper, Exception} = global.kernel.helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

import BlockchainSimpleTransaction from "./../../simple-transaction/blockchain-simple-transaction"
import TokenHashMapData from "../../../chain/maps/tokens/tokens-hash/data/token-hash-map-data";

export default class BlockchainTokenCreateSimpleTransaction extends BlockchainSimpleTransaction {

    constructor(scope, schema={}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                scriptVersion:{

                    default: TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_CREATE_TRANSACTION,

                    validation(script){
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_CREATE_TRANSACTION;
                    }
                },

                vin:{
                    minSize: 1,
                    maxSize: 1,
                    fixedBytes: 1,
                    specifyLength: false,
                },

                tokenCurrency: {

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

                tokenPublicKeyHash:{
                    type: "buffer",
                    fixedBytes: 20,

                    position: 2000,
                },

                tokenData:{
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

        if ( this.tokenData.supply !== 0) throw new Exception(this, 'TokenData supply needs to be zero');

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );

        const tokenPublicKeyHash = this._scope.cryptography.addressGenerator.generateContractPublicKeyHashFromAccountPublicKeyHash( this.vin[0].publicKeyHash, this.nonce );
        if ( !tokenPublicKeyHash.equals(this.tokenPublicKeyHash) ) throw new Exception(this, 'tokenPublicKeyHash is not matching');

        const exists = await chainData.tokenHashMap.getTokenNode( tokenPublicKeyHash );
        if (exists) throw new Exception(this, 'Token already exists');

        const existsTokenName = await chainData.tokenNameHashMap.getMap( this.tokenData.name.toLowerCase() );
        if (existsTokenName) throw new Exception(this, 'Token Name already exists');

        const existsTokenTicker = await chainData.tokenTickerHashMap.getMap( this.tokenData.ticker.toLowerCase() );
        if (existsTokenTicker) throw new Exception(this, 'Token Ticker already exists');

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        await chainData.tokenHashMap.addMap(this.tokenPublicKeyHash, this.tokenData.toJSON() );
        await chainData.tokenNameHashMap.addMap(this.tokenData.name.toLowerCase(), this.tokenPublicKeyHash.toString('hex') );
        await chainData.tokenTickerHashMap.addMap(this.tokenData.ticker.toLowerCase(), this.tokenPublicKeyHash.toString('hex') );

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        await chainData.tokenHashMap.deleteMap(this.tokenPublicKeyHash);
        await chainData.tokenNameHashMap.deleteMap(this.tokenData.name.toLowerCase()  );
        await chainData.tokenTickerHashMap.deleteMap(this.tokenData.ticker.toLowerCase() );

        return super.transactionRemoved(chain, chainData);

    }

}