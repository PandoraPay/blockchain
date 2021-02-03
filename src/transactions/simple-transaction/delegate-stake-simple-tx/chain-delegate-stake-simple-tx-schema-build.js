const {Helper, Exception, EnumHelper} = require('kernel').helpers;

const AccountHashMapDataDelegate = require( "../../../chain/maps/account-hash/element/data/account-hash-map-data-delegate-schema-build");
const {ChainSimpleTxSchemaBuild} = require('../chain-simple-tx-schema-build')
const { TxScriptTypeEnum } = require('cryptography').transactions;

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

                delegate: {
                    type: "object",
                    schemaBuildClass: AccountHashMapDataDelegate,

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