const {HashMapElement} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const AccountHashMapData = require( "./data/account-hash-map-data")

module.exports = class AccountHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "accountMap",
                    fixedBytes: 10,
                },

                data: {
                    type: "object",
                    classObject: AccountHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}