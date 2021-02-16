const {Helper, Exception, EnumHelper} = PandoraLibrary.helpers;

const {AccountDataDelegateSchemaBuilt} = require( "../../../chain/maps/account-hash/element/data/account-data-delegate-schema-build");
const {ChainSimpleTxSchemaBuild} = require('../chain-simple-tx-schema-build')
const { TxScriptTypeEnum } = PandoraLibrary.transactions;

class ChainDelegateStakeSimpleTxSchemaBuild extends ChainSimpleTxSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                scriptVersion:{

                    default: TxScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION,

                    validation(script){
                        return script === TxScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION;
                    }
                },

                vin:{
                    minSize: 1,
                    maxSize: 1,
                    specifyLength: false,
                },

                vout:{
                    minSize: 0,
                    maxSize: 0,
                    specifyLength: false,
                    emptyAllowed: true,
                },

                delegate: {
                    type: "object",
                    schemaBuiltClass: AccountDataDelegateSchemaBuilt,

                    position: 2001,
                },

            }

        }, schema, true))

    }

}

module.exports = {
    ChainDelegateStakeSimpleTxSchemaBuild,
    ChainDelegateStakeSimpleTxSchemaBuilt: new ChainDelegateStakeSimpleTxSchemaBuild()
}