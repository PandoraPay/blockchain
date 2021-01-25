const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const TxHashMapData = require( "./data/tx-hash-map-data")

module.exports = class TxHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "txMap",
                    fixedBytes: 6,
                },

                data: {
                    type: "object",
                    classObject: TxHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}