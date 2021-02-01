const {BlockchainSimpleTransactionDBSchemaBuild} = require('../../simple-transaction/blockchain-simple-transaction-db-schema-build');
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = require('cryptography').transactions;

const {BlockchainTokenCreateDataDBSchemaBuilt} = require('./data/blockchain-token-create-data-db-schema-build')

class BlockchainTokenCreateSimpleTransactionDBSchemaBuild extends BlockchainSimpleTransactionDBSchemaBuild {

    constructor(schema) {

        super( Helper.merge({

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

                tokenData:{
                    type: "object",
                    schemaBuiltClass: BlockchainTokenCreateDataDBSchemaBuilt,

                    position: 2000,
                }


            }

        }, schema, true ))

    }

}

module.exports = {
    BlockchainTokenCreateSimpleTransactionDBSchemaBuild,
    BlockchainTokenCreateSimpleTransactionDBSchemaBuilt: new BlockchainTokenCreateSimpleTransactionDBSchemaBuild()
}