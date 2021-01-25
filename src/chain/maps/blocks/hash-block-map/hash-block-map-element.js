const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class HashBlockMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "blkHashMap",
                    fixedBytes: 10,
                },

                //hash
                id:{
                    fixedBytes: 64,
                },

                //height
                data: {

                    type: "number",
                    minSize: 0,
                    maxSize: Number.MAX_SAFE_INTEGER,

                },

            },

        }, schema, false), data, type, creationOptions);

    }

}