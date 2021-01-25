const {DBSchema} = require('kernel').marshal.db;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class TxHashMapData extends DBSchema {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                blockTimestamp:{
                    type: "number",
                    position: 100,
                },

                blockHeight: {
                    type: "number",
                    position: 101,
                },

                //height in binary merkle tree
                merkleHeight:{
                    type: "number",
                    position: 102,
                },

                //leaf index
                merkleLeafHeight:{
                    type: "number",
                    position: 103,
                },

            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, false), data, type, creationOptions);

    }

}