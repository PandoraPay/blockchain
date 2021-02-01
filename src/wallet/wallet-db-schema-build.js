const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const {EncryptedDBSchemaBuilt} = require('cryptography').schemas.EncryptedDBSchemaBuild;
const {EncryptedDBModel} = require('cryptography').models;

const DBModelWalletAddress = require('./addresses/wallet-address-db-model')
const {WalletAddressDBSchemaBuilt} = require('./addresses/wallet-address-db-schema-build')

class WalletDBSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "wallet",
                    fixedBytes: 6,
                },

                id: {
                    default: "main",
                    fixedBytes: 4,
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
                    schemaBuildClass: EncryptedDBSchemaBuilt,
                    modelClass: EncryptedDBModel,

                    position: 102,
                },

                mnemonicChecksum: {
                    type: "buffer",
                    fixedBytes: 32,

                    position: 103,
                },

                mnemonicSequenceCounter: {

                    type: "object",
                    schemaBuildClass: EncryptedDBSchemaBuilt,
                    modelClass: EncryptedDBModel,

                    position: 104,
                },

                addresses: {
                    type: "array",
                    schemaBuildClass: WalletAddressDBSchemaBuilt,
                    modelClass: DBModelWalletAddress,

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
    WalletDBSchemaBuild,
    WalletDBSchemaBuilt: new WalletDBSchemaBuild(),
}