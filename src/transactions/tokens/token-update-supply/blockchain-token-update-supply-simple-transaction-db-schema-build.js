const {BlockchainSimpleTransactionDBSchemaBuild} = require('../../simple-transaction/blockchain-simple-transaction-db-schema-build')
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = require('cryptography').transactions;
const {Helper, Exception} = require('kernel').helpers;

const { BlockchainTokenUpdateSupplyDataDBSchemaBuilt } = require('./data/blockchain-token-update-supply-data-db-schema-build')

class BlockchainTokenUpdateSupplySimpleTransactionDBSchemaBuild extends BlockchainSimpleTransactionDBSchemaBuild {

    constructor( schema = {}) {

        super(Helper.merge({

            fields: {

                scriptVersion: {

                    default: TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION,

                    validation(script) {
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION;
                    }
                },

                vin: {
                    minSize: 1,
                    maxSize: 1,
                    fixedBytes: 1,
                    specifyLength: false,
                },

                vout: {
                    minSize: 0,
                    maxSize: 0,
                    fixedBytes: 0,
                    specifyLength: false,
                    emptyAllowed: true,
                },

                tokenUpdateData:{
                    type: "object",
                    schemaBuiltClass: BlockchainTokenUpdateSupplyDataDBSchemaBuilt,

                    position: 2000,
                },


            }

        }, schema, true))

    }

}

module.exports = {
    BlockchainTokenUpdateSupplySimpleTransactionDBSchemaBuild,
    BlockchainTokenUpdateSupplySimpleTransactionDBSchemaBuilt: new BlockchainTokenUpdateSupplySimpleTransactionDBSchemaBuild()
}