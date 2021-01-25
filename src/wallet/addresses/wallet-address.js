const {DBSchema} = require('kernel').marshal.db;
const {Helper, EnumHelper, Exception, BufferHelper} = require('kernel').helpers;
const {CryptoHelper} = require('kernel').helpers.crypto;

const {DBSchemaBuffer, DBSchemaNumber} = require('kernel').marshal.db.samples;
const {DBEncryptedSchema, } = require('cryptography').marshal.db.samples;

const WalletAddressTypeEnum = require( "./data/wallet-address-type-enum")
const WalletAddressTransparentKeys = require( "./data/wallet-address-transparent-keys");

module.exports = class WalletAddress extends DBSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

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

                    mnemonicSequenceIndex:{
                        type: "object",
                        classObject: DBEncryptedSchema,

                        position: 103,
                    },

                    keys: {
                        type: "object",

                        classObject(){
                            if (this.type === WalletAddressTypeEnum.WALLET_ADDRESS_TRANSPARENT) return WalletAddressTransparentKeys;
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
            schema, false), data, type, creationOptions);


    }

    get wallet(){
        return this.parent;
    }


    /**
     * extracting mnemonic sequence index
     */

    decryptMonemonicSequenceIndex(password){

        this.wallet.encryption.decryptWallet(password);
        return this.mnemonicSequenceIndex.decryptKey();
    }



}