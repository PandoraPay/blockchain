const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception, StringHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

import SidechainStatusTypeEnum from "./sidechain-status-type-enum"

export default class SidechainHashMapData extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge({

            fields: {

                version: {
                    type: "number",
                    minLength: 1,
                    maxLength: 2,

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 100,
                },

                name:{
                    type: 'string',

                    minSize: 2,
                    maxSize: 32,

                    /**
                     * only lowercase ascii and one space between words is allowed.
                     */
                    validation(name){
                        return /^([a-zA-Z0-9]+ )+[a-zA-Z0-9]+$|^[a-zA-Z0-9]+$/.exec(name);
                    },

                    position: 101,
                },

                description:{
                    type: 'string',

                    minSize: 0,
                    maxSize: 512,

                    position: 102,
                },


                uri: {
                    type: "string",
                    minSize: 2,
                    maxSize: 32,

                    /**
                     * only lowercase ascii and one space between words is allowed.
                     */
                    validation(uri){
                        return /^((http|https):\/\/)?(www.)?(?!.*(http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/.exec(uri);
                    },

                    position: 103,
                },

                beaconPublicKey:{

                    type: "buffer",
                    fixedBytes: 32,

                    position: 104,
                },

                sidechainStatus: {
                    type: "number",
                    fixedBytes: 1,
                    default: SidechainStatusTypeEnum.SIDECHAIN_STATUS_DISABLED,

                    validation: value => EnumHelper.validateEnum(value, SidechainStatusTypeEnum),

                    position: 105,
                },

                securityDeposit:{
                    type: "number",

                    position: 106,
                },

                securityDepositReleased:{
                    type: "number",

                    position: 107,
                },

                securityDepositReleasedBlockHeight: {
                    type: "number",

                    position: 108,
                },

                sidechainLastActivity:{
                    type: "number",

                    position: 109,
                },

            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: CryptoHelper.sha256

                },
            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, false), data, type, creationOptions);

    }

}
