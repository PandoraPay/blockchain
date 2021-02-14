const {DBSchemaBuild} = require('kernel').db;
const {Helper, BufferHelper} = require('kernel').helpers;
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

                /**
                 * Used for encryption
                 */
                salt: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    default(){
                        return BufferHelper.generateRandomBuffer(32);
                    },

                    position: 101,
                },

                encrypted: {

                    type: "boolean",
                    default: false,

                    position: 102,
                },

                mnemonic: {

                    type: "object",
                    schemaBuildClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 103,
                },

                mnemonicChecksum: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    position: 104,
                },

                mnemonicSequenceCounter: {

                    type: "object",
                    schemaBuildClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 105,
                },

                addresses: {
                    type: "array",
                    schemaBuildClass: WalletAddressSchemaBuilt,
                    modelClass: WalletAddressModel,

                    minSize: 0,
                    maxSize: 4095,

                    position: 106,
                },

            },

        }, schema, true));

    }
}

module.exports = {
    WalletSchemaBuild,
    WalletSchemaBuilt: new WalletSchemaBuild(),
}