const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper, Exception, EnumHelper} = PandoraLibrary.helpers;
const {CryptoHelper} = PandoraLibrary.helpers.crypto;
const {EncryptedSchemaBuilt} = PandoraLibrary.schemas.EncryptedSchemaBuild;
const {EncryptedModel} = PandoraLibrary.models;

const WalletAddressTypeEnum = require('./wallet-address-type-enum')

const {WalletAddressTransparentKeySchemaBuilt} = require('./keys/wallet-address-transparent-keys-schema-build')
const WalletAddressTransparentKeysModel = require('./keys/wallet-address-transparent-keys-model')

class WalletAddressSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super( Helper.merge({

            fields: {

                table: {
                    default: "address",
                    minSize: 7,
                    maxSize: 7,
                },

                version: {
                    type: "number",

                    default: 0,

                    validation(version) {
                        return version === 0;
                    },

                    position: 100,

                },

                type: {
                    type: "number",

                    default: 0,

                    validation: value => EnumHelper.validateEnum(value, WalletAddressTypeEnum),

                    position: 101,
                },

                name: {
                    type: "string",
                    minSize: 0,
                    maxSize: 255,

                    default: "account",

                    position: 102,
                },

                mnemonicSequenceIndex: {
                    type: "object",
                    schemaBuiltClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 103,
                },

                keys: {
                    type: "object",

                    schemaBuiltClass() {
                        if (this.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) return WalletAddressTransparentKeySchemaBuilt;
                    },
                    modelClass(){
                        if (this.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) return WalletAddressTransparentKeysModel;
                    },

                    position: 104,
                },


            },

        },
        schema, true ));

    }

}

module.exports = {
    WalletAddressSchemaBuild,
    WalletAddressSchemaBuilt: new WalletAddressSchemaBuild(),
}