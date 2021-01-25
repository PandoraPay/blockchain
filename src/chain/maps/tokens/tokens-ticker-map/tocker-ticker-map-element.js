const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class TokenTickerMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenTickerMap",
                    fixedBytes: 14,
                },

                id:{
                    minSize: 2,
                    maxSize: 6,
                },

                data: {
                    type: "string",
                    fixedBytes: 40,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}