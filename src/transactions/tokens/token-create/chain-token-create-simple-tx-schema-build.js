const {ChainSimpleTxSchemaBuild} = require('../../simple-transaction/chain-simple-tx-schema-build');
const {Helper, Exception, EnumHelper} = PandoraLibrary.helpers;
const {TxTypeEnum, TxScriptTypeEnum, TxTokenCurrencyTypeEnum} = PandoraLibrary.transactions;

const {ChainTokenCreateDataSchemaBuilt} = require('./data/chain-token-create-data-schema-build')

class ChainTokenCreateSimpleTxSchemaBuild extends ChainSimpleTxSchemaBuild {

    constructor(schema) {

        super( Helper.merge({

            fields: {

                scriptVersion:{

                    default: TxScriptTypeEnum.TX_SCRIPT_TOKEN_CREATE_TRANSACTION,

                    validation(script){
                        return script === TxScriptTypeEnum.TX_SCRIPT_TOKEN_CREATE_TRANSACTION;
                    }
                },

                vin:{
                    minSize: 1,
                    maxSize: 1,
                    specifyLength: false,
                },

                vout:{
                    minSize: 1,
                    maxSize: 1,
                    specifyLength: false,
                },

                tokenData:{
                    type: "object",
                    schemaBuiltClass: ChainTokenCreateDataSchemaBuilt,

                    position: 2000,
                }


            }

        }, schema, true ))

    }

}

module.exports = {
    ChainTokenCreateSimpleTxSchemaBuild,
    ChainTokenCreateSimpleTxSchemaBuilt: new ChainTokenCreateSimpleTxSchemaBuild()
}