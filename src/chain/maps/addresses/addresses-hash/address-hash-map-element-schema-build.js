const {HashMapElementSchemaBuild} = require('kernel').dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = require('kernel').helpers;

class AddressHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super( Helper.merge({

            fields: {

                table: {
                    default: "addrMap",
                    fixedBytes: 7,
                },

                version: {
                    type: "number",
                    default: 0,
                    validation(value){
                        return value === 0;
                    },
                    position: 10000,
                },

                data: null,

                txsCount: {
                    type: "number",
                    position: 10001,
                },

            },

        }, schema, true) );

    }

}

module.exports = {
    AddressHashMapElementSchemaBuild,
    AddressHashMapElementSchemaBuild: new AddressHashMapElementSchemaBuild()
}