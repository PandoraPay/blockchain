
const {Helper, Exception} = require('kernel').helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = require('cryptography').transactions;

const BlockchainSimpleTransaction = require("./../../simple-transaction/blockchain-simple-transaction")
const TokenHashMapData = require( "../../../chain/maps/tokens/tokens-hash/data/token-hash-map-data");

module.exports = class BlockchainTokenCreateSimpleTransaction extends BlockchainSimpleTransaction {

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

                vout:{
                    minSize: 1,
                    maxSize: 1,
                    fixedBytes: 1,
                    specifyLength: false,
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

        if (this.vout.length !== 1 || !this.vout[0].publicKeyHash.equals(this._scope.argv.blockchain.genesis.BURN_PUBLIC_KEY_HASH) )
            throw new Exception(this, 'A burning fee has to be paid');

        if (!this._scope.argv.transactions.tokens.validateCreateTokenFee( this.vout[0].amount, block.height ))
            throw new Exception(this, 'Fee too small for creating a new token to avoid spamming with useless tokens');

        if (!this.vout[0].tokenCurrency.equals(TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id) )
            throw new Exception(this, 'TokenCurrency for creating a new token to avoid spamming with useless tokens is invalid');

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