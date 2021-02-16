const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper, Exception, EnumHelper} = PandoraLibrary.helpers;
const {CryptoHelper} = PandoraLibrary.helpers.crypto;
const {EncryptedSchemaBuilt} = PandoraLibrary.schemas.EncryptedSchemaBuild;
const {EncryptedModel} = PandoraLibrary.models;

class WalletAddressTransparentKeySchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge( {

            fields:{

                table: {
                    default: "keys",
                    minSize: 4,
                    maxSize: 4,
                },

                version: {
                    type: "number",

                    default: 0,

                    validation(version){
                        return version === 0;
                    },

                    position: 100,

                },

                private:{
                    type: "object",
                    schemaBuiltClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 101,
                },

                public:{
                    type: "object",
                    schemaBuiltClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 102,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    WalletAddressTransparentKeySchemaBuild,
    WalletAddressTransparentKeySchemaBuilt: new WalletAddressTransparentKeySchemaBuild(),
}