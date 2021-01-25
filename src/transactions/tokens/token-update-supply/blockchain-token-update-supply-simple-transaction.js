const {SimpleTransaction} = require('cryptography').transactions.simpleTransaction;
const {Helper, Exception} = require('kernel').helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = require('cryptography').transactions;

const BlockchainSimpleTransaction = require( "../../simple-transaction/blockchain-simple-transaction");

module.exports = class BlockchainTokenUpdateSupplySimpleTransaction extends BlockchainSimpleTransaction {

    constructor(scope, schema={}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                scriptVersion:{

                    default: TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION,

                    validation(script){
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION;
                    }
                },

                vin:{
                    minSize: 1,
                    maxSize: 1,
                    fixedBytes: 1,
                    specifyLength: false,
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

                supplySign:{
                    type: "boolean",

                    position: 2001,
                },

                supplyValue:{
                    type: "number",
                    minSize: 1,

                    position: 2002,
                },


            }

        }, schema, false), data, type, creationOptions);

    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        const out = await super.validateTransaction(chain, chainData, block);
        if (!out) return false;

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );


        const token = await chainData.tokenHashMap.getTokenNode( this.tokenPublicKeyHash );
        if (!token) throw new Exception(this, `Token doesn't exist`);

        if (!token.verificationPublicKey.equals(this.vin[0].publicKey)) //validate the printer public key hash
            throw new Exception(this, 'verificationPublicKey is not matching');

        const newSupply = token.supply + this.supplySignValue * this.supplyValue;
        if ( newSupply > token.maxSupply || newSupply < 0 ) throw new Exception(this, "New Supply exceeded max supply", {newSupply });

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        const newSupply = await chainData.tokenHashMap.updateTokenSupply( this.tokenPublicKeyHash, this.supplySignValue * this.supplyValue );
        if (newSupply < 0) throw new Exception(this, "New Supply got negative", {newSupply });

        const balance = await chainData.accountHashMap.updateBalance( this.vin[0].publicKeyHash, this.supplySignValue * this.supplyValue, this.tokenPublicKeyHash );
        if (balance < 0) throw new Exception(this, 'balance got negative', {balance});

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        const balance = await chainData.accountHashMap.updateBalance( this.vin[0].publicKeyHash, (-this.supplySignValue) * this.supplyValue, this.tokenPublicKeyHash );
        if (balance < 0) throw new Exception(this, 'balance got negative', {balance});

        const newSupply = await chainData.tokenHashMap.updateTokenSupply( this.tokenPublicKeyHash, (-this.supplySignValue) * this.supplyValue );
        if (newSupply < 0) throw new Exception(this, "New Supply got negative", {newSupply });

        return super.transactionRemoved(chain, chainData);

    }

    get supplySignValue(){
        return this.supplySign ? 1 : - 1;
    }

}