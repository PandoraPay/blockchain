const {DBSchema} = require('kernel').marshal.db;
const {Helper, Exception} = require('kernel').helpers;

module.exports = class AddressHashMapData extends DBSchema {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                txsCount: {
                    type: "number",
                    position: 100,
                },

            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, false), data, type, creationOptions);

    }

}