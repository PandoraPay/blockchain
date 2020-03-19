const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, StringHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

export default class ZetherAccountHashMapData extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge({

            fields: {

                version: {
                    type: "number",
                    fixedBytes: 1,

                    default: 0,
                    validation(version){
                        return version === 0;
                    },
                    position: 100,
                },

                value1: {
                    type: "buffer",
                    fixedBytes: 32,

                    position: 101,
                },

                value1_1: {
                    type: "buffer",
                    fixedBytes: 32,

                    position: 102,
                },

                value2: {
                    type: "buffer",
                    fixedBytes: 64,

                    position: 103,
                },

                value2_2: {
                    type: "buffer",
                    fixedBytes: 64,

                    position: 104,
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

    isEmpty(){
        const empty = Buffer.alloc(32);
        return this.value1.equals( empty ) && this.value1_1.equals(empty) && this.value2.equals(empty) && this.value2_2.equals(empty);
    }

}
