const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

import TxHashMapData from "./data/tx-hash-map-data"

export default class TxHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "txMap",
                    fixedBytes: 6,
                },

                data: {
                    type: "object",
                    classObject: TxHashMapData,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}