const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class AddressTxHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {


                //format: `address_0`, `address_1`
                id: {
                    fixedBytes: null,
                    minSize: 42,
                    maxSize: 55,
                },

                table: {
                    default: "addrTxMap",
                    fixedBytes: 9,
                },


                data: {
                    type: "buffer",
                    fixedBytes: 32,
                },


            },

        }, schema, false), data, type, creationOptions);

    }

}