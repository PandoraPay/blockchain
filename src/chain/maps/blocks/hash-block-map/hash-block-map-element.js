const {HashMapElement} = global.kernel.dataStructures.hashMap;
const {Helper, Exception} = global.kernel.helpers;

export default class HashBlockMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "blkHashMap",
                    fixedBytes: 10,
                },

                //hash
                id:{
                    fixedBytes: 64,
                },

                //height
                data: {

                    type: "number",
                    minSize: 0,
                    maxSize: Number.MAX_SAFE_INTEGER,

                },

            },

        }, schema, false), data, type, creationOptions);

    }

}