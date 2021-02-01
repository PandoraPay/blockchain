const {Helper, Exception, EnumHelper} = require('kernel').helpers;

const AccountHashMapDataDelegate = require( "../../../chain/maps/account-hash/element/data/account-hash-map-data-delegate-schema-build");
const {BlockchainSimpleTransactionDBSchemaBuild} = require('../blockchain-simple-transaction-db-schema-build')
const { TransactionScriptTypeEnum } = require('cryptography').transactions;

class BlockchainDelegateStakeSimpleTransactionDBSchemaBuild extends BlockchainSimpleTransactionDBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                scriptVersion:{

                    default: TransactionScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION,

                    validation(script){
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_DELEGATE_STAKE_TRANSACTION;
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
    BlockchainDelegateStakeSimpleTransactionDBSchemaBuild,
    BlockchainDelegateStakeSimpleTransactionDBSchemaBuilt: new BlockchainDelegateStakeSimpleTransactionDBSchemaBuild()
}