const {Helper, Exception} = global.kernel.helpers;
const {DBSchema} = global.kernel.marshal.db;
const {DBSchemaBuffer, DBSchemaString} = global.kernel.marshal.db.samples;

import Block from "src/block/block"

export default class SubChainDataBlock extends DBSchema {


    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "chainBlock",
                        fixedBytes: 10,
                    },

                    version: {
                        default: 0,
                    },

                    hash: {

                        type: "object",
                        classObject: DBSchemaBuffer,

                        preprocessor(hash){
                            this.id = hash.toString("hex");
                            return hash;
                        },

                        position: 101,
                    },

                    block: {

                        type: "object",
                        classObject: Block,

                        position: 102,
                    },

                    id: {
                        fixedBytes: 32,
                        default(){
                            return this.hash().toString("hex");
                        },
                        unique: true,
                    },

                }

            },
            schema, false), data, type, creationOptions);


    }


}