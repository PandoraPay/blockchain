const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const {EncryptedSchemaBuilt} = require('cryptography').schemas.EncryptedSchemaBuild;
const {EncryptedModel} = require('cryptography').models;

const WalletAddressModel = require('./addresses/wallet-address-model')
const {WalletAddressSchemaBuilt} = require('./addresses/wallet-address-schema-build')

class WalletSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "wallet",
                    minSize: 6,
                    maxSize: 6,
                },

                id: {
                    default: "main",
                    minSize: 4,
                    maxSize: 4,
                },

                version: {
                    type: "number",
                    default: 0,

                    validation(value) {
                        return value === 0;
                    },

                    position: 100,
                },

                encrypted: {

                    type: "boolean",
                    default: false,

                    position: 101,
                },

                mnemonic: {

                    type: "object",
                    schemaBuildClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 102,
                },

                mnemonicChecksum: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    position: 103,
                },

                mnemonicSequenceCounter: {

                    type: "object",
                    schemaBuildClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 104,
                },

                addresses: {
                    type: "array",
                    schemaBuildClass: WalletAddressSchemaBuilt,
                    modelClass: WalletAddressModel,

                    minSize: 0,
                    maxSize: 4095,

                    position: 105,
                },

            },

            options: {
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,
                    fct: CryptoHelper.dkeccak256,
                }
            }

        }, schema, true));

    }
}

module.exports = {
    WalletSchemaBuild,
    WalletSchemaBuilt: new WalletSchemaBuild(),
}