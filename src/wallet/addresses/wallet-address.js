const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception, BufferHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

const {DBSchemaBuffer, DBSchemaNumber} = global.kernel.marshal.db.samples;
const {DBEncryptedSchema, } = global.cryptography.marshal.db.samples;

import WalletAddressTypeEnum from "./data/wallet-address-type-enum"
import WalletAddressTransparentKeys from "./data/wallet-address-transparent-keys";

export default class WalletAddress extends DBSchema {

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