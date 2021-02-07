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
                    default: "address",
                    minSize: 6,
                    maxSize: 6,
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

            options: {
                hashing: {
                    enabled: true,
                    parentHashingPropagation: true,
                    fct: CryptoHelper.dkeccak256,
                }
            }

        }, schema, true) );

    }

}

module.exports = {
    WalletAddressTransparentKeySchemaBuild,
    WalletAddressTransparentKeySchemaBuilt: new WalletAddressTransparentKeySchemaBuild(),
}