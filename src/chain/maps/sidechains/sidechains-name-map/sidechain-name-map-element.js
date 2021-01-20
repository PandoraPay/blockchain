const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

export default class SidechainNameMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "sidechainNameMap",
                    fixedBytes: 12,
                },

                id:{
                    minSize: 2,
                    maxSize: 32,
                },

                data: {
                    type: "string",
                    fixedBytes: 40,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}