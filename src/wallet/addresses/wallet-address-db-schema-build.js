const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;
const {EncryptedDBSchemaBuilt} = require('cryptography').schemas.EncryptedDBSchemaBuild;
const {EncryptedDBModel} = require('cryptography').models;

const WalletAddressTypeEnum = require('./wallet-address-type-enum')

const {WalletAddressTransparentKeyDBSchemaBuilt} = require('./keys/wallet-address-transparent-keys-db-schema-build')
const WalletAddressTransparentKeysDBModel = require('./keys/wallet-address-transparent-keys-db-model')

class WalletAddressDBSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super( Helper.merge({

            fields: {

                table: {
                    default: "address",
                    fixedBytes: 6,
                },

                version: {
                    type: "number",
                    fixedBytes: 1,

                    default: 0,

                    validation(version) {
                        return version === 0;
                    },

                    position: 100,

                },

                type: {
                    type: "number",
                    fixedBytes: 1,

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
                    schemaBuildClass: EncryptedDBSchemaBuilt,
                    modelClass: EncryptedDBModel,

                    position: 103,
                },

                keys: {
                    type: "object",

                    schemaBuildClass() {
                        if (this.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) return WalletAddressTransparentKeyDBSchemaBuilt;
                    },
                    modelClass(){
                        if (this.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) return WalletAddressTransparentKeysDBModel;
                    },

                    position: 104,
                },


            },

            options: {
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,
                    fct: CryptoHelper.dkeccak256,
                }
            }

        },
        schema, true ));

    }

}

module.exports = {
    WalletAddressDBSchemaBuild,
    WalletAddressDBSchemaBuilt: new WalletAddressDBSchemaBuild(),
}