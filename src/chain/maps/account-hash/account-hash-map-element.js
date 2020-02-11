const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import AccountHashMapData from "./data/account-hash-map-data"

export default class AccountHashMapElement extends HashMapElement {

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