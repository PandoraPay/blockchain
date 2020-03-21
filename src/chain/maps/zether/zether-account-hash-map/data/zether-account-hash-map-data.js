const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, StringHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

const Zether = global.cryptography.zether;

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

                value0: {
                    type: "buffer",
                    fixedBytes: 64,

                    position: 101,
                },

                value1: {
                    type: "buffer",
                    fixedBytes: 64,

                    position: 103,
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
        const empty = Buffer.alloc(64);
        return this.value0.equals( empty ) && this.value1.equals(empty);
    }

    get point0(){
        return Zether.utils.unserializeFromBuffer(this.value0);
    }

    get point1(){
        return Zether.utils.unserializeFromBuffer(this.value1);
    }

}
