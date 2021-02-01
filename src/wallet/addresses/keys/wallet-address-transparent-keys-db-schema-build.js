const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;
const {EncryptedDBSchemaBuilt} = require('cryptography').schemas.EncryptedDBSchemaBuild;
const {EncryptedDBModel} = require('cryptography').models;

class WalletAddressTransparentKeyDBSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge( {

            fields:{

                table: {
                    default: "address",
                    fixedBytes: 6,
                },

                version: {
                    type: "number",
                    fixedBytes: 1,

                    default: 0,

                    validation(version){
                        return version === 0;
                    },

                    position: 100,

                },

                private:{
                    type: "object",
                    schemaBuildClass: EncryptedDBSchemaBuilt,
                    modelClass: EncryptedDBModel,

                    position: 101,
                },

                public:{
                    type: "object",
                    schemaBuildClass: EncryptedDBSchemaBuilt,
                    modelClass: EncryptedDBModel,

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
    WalletAddressTransparentKeyDBSchemaBuild,
    WalletAddressTransparentKeyDBSchemaBuilt: new WalletAddressTransparentKeyDBSchemaBuild(),
}