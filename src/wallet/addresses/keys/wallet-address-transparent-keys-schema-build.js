const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;
const {EncryptedSchemaBuilt} = require('cryptography').schemas.EncryptedSchemaBuild;
const {EncryptedModel} = require('cryptography').models;

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
                    schemaBuildClass: EncryptedSchemaBuilt,
                    modelClass: EncryptedModel,

                    position: 101,
                },

                public:{
                    type: "object",
                    schemaBuildClass: EncryptedSchemaBuilt,
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