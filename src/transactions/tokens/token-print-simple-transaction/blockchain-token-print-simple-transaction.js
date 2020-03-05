import BlockchainSimpleTransaction from "../../simple-transaction/blockchain-simple-transaction";

export default class BlockchainTokenPrintSimpleTransaction extends BlockchainSimpleTransaction {

    constructor(scope, schema={}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                scriptVersion:{

                    default: TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_PRINT_TRANSACTION,

                    validation(script){
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_PRINT_TRANSACTION;
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

                supply:{
                    type: "number",
                    minSize: 1,

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


        const token = await chainData.tokenHashMap.getTokenNode( this.tokenPublicKeyHash );
        if (!token) throw new Exception(this, `Token doesn't exist`);

        if (!token.data.printerPublicKeyHash.equals(this.vin[0].publicKeyHash)) //validate the printer public key hash
            throw new Exception(this, 'printerPublicKeyHash is not matching');

        if (token.data.supply + this.supply > token.data.maxSupply)
            throw new Exception(this, 'The new ');

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        await chainData.tokenHashMap.addMap(this.tokenPublicKeyHash, this.tokenData.toJSON() );

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        await chainData.tokenHashMap.deleteMap(this.tokenPublicKeyHash);

        return super.transactionRemoved(chain, chainData);

    }

}