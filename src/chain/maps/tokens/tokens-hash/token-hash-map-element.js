const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import TokenHashMapData from "./data/token-hash-map-data"

export default class AccountHashMapElement extends HashMapElement {

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