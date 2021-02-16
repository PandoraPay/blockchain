const {HashMapElementSchemaBuild} = PandoraLibrary.dataStructures.hashMap.schema.HashMapElementSchemaBuild;
const {Helper, Exception} = PandoraLibrary.helpers;

class AddressTxHashMapElementSchemaBuild extends HashMapElementSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {


                //format: `address_0`, `address_1`
                id: {
                    minSize: 42,
                    maxSize: 55,
                },

                table: {
                    default: "addrTxMap",
                    minSize: 9,
                    maxSize: 9,
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

                hash: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,
                    position: 10001,
                },


            },

        }, schema, true), );

    }

}

module.exports = {
    AddressTxHashMapElementSchemaBuild,
    AddressTxHashMapElementSchemaBuilt: new AddressTxHashMapElementSchemaBuild()
}