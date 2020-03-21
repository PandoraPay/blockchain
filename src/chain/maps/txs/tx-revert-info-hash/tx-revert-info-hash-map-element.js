const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

export default class TxRevertInfoHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "txRevertMap",
                    fixedBytes: 11,
                },

                //i will store json, it will be easier
                data: {
                    type: "string",
                    maxSize: 100000,
                    minSize: 0,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}