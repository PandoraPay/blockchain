const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const AddressHashMapData = require( "./data/address-hash-map-data")

module.exports = class AddressHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "addrMap",
                    fixedBytes: 7,
                },

                data: {
                    type: "object",
                    classObject: AddressHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}