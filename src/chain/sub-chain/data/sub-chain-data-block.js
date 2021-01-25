const {Helper, Exception} = require('kernel').helpers;
const {DBSchema} = require('kernel').marshal.db;
const {DBSchemaBuffer, DBSchemaString} = require('kernel').marshal.db.samples;

const Block = require("../../../block/block")

module.exports = class SubChainDataBlock extends DBSchema {


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