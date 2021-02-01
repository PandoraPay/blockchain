const {SimpleTransactionDBSchemaBuild} = require('cryptography').transactions.simpleTransaction.SimpleTransactionDBSchemaBuild;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;

class BlockchainSimpleTransactionDBSchemaBuild extends SimpleTransactionDBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                nonce: {

                    type: "number",
                    position: 10000,

                },

            }

        }, schema, true))

    }

}

module.exports = {
    BlockchainSimpleTransactionDBSchemaBuild,
    BlockchainSimpleTransactionDBSchemaBuilt: new BlockchainSimpleTransactionDBSchemaBuild()
}