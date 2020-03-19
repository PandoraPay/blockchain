const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ZetherAccountHashMapData from "./data/zether-account-hash-map-data"

export default class ZetherAccountHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "zetherAccount",
                    fixedBytes: 13,
                },

                data: {
                    type: "object",
                    classObject: ZetherAccountHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}