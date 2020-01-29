const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import AddressHashMapData from "./data/address-hash-map-data"

export default class AddressHashMapElement extends HashMapElement {

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