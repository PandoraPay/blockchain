const {Helper, Exception} = require('kernel').helpers;
const {TxTypeEnum, TxScriptTypeEnum, TxTokenCurrencyTypeEnum} = require('cryptography').transactions;

const ChainSimpleTxModel = require("../../simple-transaction/chain-simple-tx-model")
const {ChainTokenCreateSimpleTxSchemaBuilt} = require('./chain-token-create-simple-tx-schema-build')

module.exports = class ChainTokenCreateSimpleTxModel extends ChainSimpleTxModel {

    constructor(scope, schema= ChainTokenCreateSimpleTxSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        const out = await super.validateTransaction(chain, chainData, block);
        if (!out) return false;

        if (this.vout.length !== 1 || !this.vout[0].publicKeyHash.equals(this._scope.argv.blockchain.genesis.BURN_PUBLIC_KEY_HASH) )
            throw new Exception(this, 'A burning fee has to be paid');

        if (!this._scope.argv.transactions.tokens.validateCreateTokenFee( this.vout[0].amount, block.height ))
            throw new Exception(this, 'Fee too small for creating a new token to avoid spamming with useless tokens');

        if (!this.vout[0].tokenCurrency.equals(TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer) )
            throw new Exception(this, 'TokenCurrency for creating a new token to avoid spamming with useless tokens is invalid');

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );

        const tokenPublicKeyHash = this._scope.cryptography.addressGenerator.generateContractPublicKeyHashFromAccountPublicKeyHash( this.vin[0].publicKeyHash, this.nonce );
        if ( !tokenPublicKeyHash.equals(this.tokenData.tokenPublicKeyHash) ) throw new Exception(this, 'tokenPublicKeyHash is not matching');

        const exists = await chainData.tokenHashMap.getTokenNodeData( tokenPublicKeyHash );
        if (exists) throw new Exception(this, 'Token already exists');

        const existsTokenName = await chainData.tokenNameMap.getMap( this.tokenData.name.toUpperCase() );
        if (existsTokenName) throw new Exception(this, 'Token Name already exists');

        const existsTokenTicker = await chainData.tokenTickerMap.getMap( this.tokenData.ticker.toUpperCase() );
        if (existsTokenTicker) throw new Exception(this, 'Token Ticker already exists');

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        await chainData.tokenHashMap.addMap(this.tokenData.tokenPublicKeyHash, {
            data: this.tokenData.toJSON()
        } );
        await chainData.tokenNameMap.addMap(this.tokenData.name.toUpperCase(), this.tokenPublicKeyHash );
        await chainData.tokenTickerMap.addMap(this.tokenData.ticker.toUpperCase(), this.tokenPublicKeyHash );

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        await chainData.tokenHashMap.deleteMap(this.tokenData.tokenPublicKeyHash);
        await chainData.tokenNameMap.deleteMap(this.tokenData.name.toUpperCase()  );
        await chainData.tokenTickerMap.deleteMap(this.tokenData.ticker.toUpperCase() );

        return super.transactionRemoved(chain, chainData);

    }

}