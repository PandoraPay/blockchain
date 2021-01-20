const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import SidechainHashMapData from "./data/sidechain-hash-map-data"

export default class SidechainHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "sidechainMap",
                    fixedBytes: 12,
                },

                data: {
                    type: "object",
                    classObject: SidechainHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}