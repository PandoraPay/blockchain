const {ChainSimpleTxSchemaBuild} = require('../../simple-transaction/chain-simple-tx-schema-build')
const {TxTypeEnum, TxScriptTypeEnum, TxTokenCurrencyTypeEnum} = require('cryptography').transactions;
const {Helper, Exception} = require('kernel').helpers;

const { ChainTokenUpdateSupplyDataSchemaBuilt } = require('./data/chain-token-update-supply-data-schema-build')

class ChainTokenUpdateSupplySimpleTxSchemaBuild extends ChainSimpleTxSchemaBuild {

    constructor( schema = {}) {

        super(Helper.merge({

            fields: {

                scriptVersion: {

                    default: TxScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION,

                    validation(script) {
                        return script === TxScriptTypeEnum.TX_SCRIPT_TOKEN_UPDATE_SUPPLY_TRANSACTION;
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
                    schemaBuiltClass: ChainTokenUpdateSupplyDataSchemaBuilt,

                    position: 2000,
                },


            }

        }, schema, true))

    }

}

module.exports = {
    ChainTokenUpdateSupplySimpleTxSchemaBuild,
    ChainTokenUpdateSupplySimpleTxSchemaBuilt: new ChainTokenUpdateSupplySimpleTxSchemaBuild()
}