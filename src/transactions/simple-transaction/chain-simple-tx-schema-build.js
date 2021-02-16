const {SimpleTxSchemaBuild} = PandoraLibrary.transactions.simpleTransaction.SimpleTxSchemaBuild;
const {Helper, Exception, EnumHelper} = PandoraLibrary.helpers;

class ChainSimpleTxSchemaBuild extends SimpleTxSchemaBuild {

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
    ChainSimpleTxSchemaBuild: ChainSimpleTxSchemaBuild,
    ChainSimpleTxSchemaBuilt: new ChainSimpleTxSchemaBuild()
}