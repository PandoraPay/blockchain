const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const TokenHashMapData = require( "./data/token-hash-map-data")

module.exports = class TokenHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenMap",
                    fixedBytes: 8,
                },

                data: {
                    type: "object",
                    classObject: TokenHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}