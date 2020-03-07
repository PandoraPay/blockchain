const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

export default class TokenTickerMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenTickerMap",
                    fixedBytes: 14,
                },

                string:{
                    minSize: 2,
                    maxSize: 6,
                },

                data: {
                    type: "string",
                    fixedBytes: 40,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

}