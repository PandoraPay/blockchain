const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ZetherPendingHashMapData from "./data/zether-pending-hash-map-data"

export default class ZetherPendingHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "zetPending",
                    fixedBytes: 10,
                },

                id: {
                    fixedBytes: 64,
                },

                data: {
                    type: "object",
                    classObject: ZetherPendingHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}