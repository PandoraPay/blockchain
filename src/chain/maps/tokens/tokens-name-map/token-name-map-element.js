const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class TokenNameMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenNameMap",
                    fixedBytes: 12,
                },

                id:{
                    minSize: 2,
                    maxSize: 15,
                },

                data: {
                    type: "string",
                    fixedBytes: 40,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}