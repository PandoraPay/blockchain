const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import ZetherLastRollOverHashMapData from "./data/zether-last-roll-over-hash-map-data"

export default class ZetherLastRollOverHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "zetLastRollOver",
                    fixedBytes: 15,
                },

                id: {
                    fixedBytes: 64,
                },

                data: {
                    type: "object",
                    classObject: ZetherLastRollOverHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}