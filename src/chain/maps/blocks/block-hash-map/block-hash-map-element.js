const {HashMapElement} = global.protocol.dataStructures.hashMap;
const {Helper, Exception} = global.protocol.helpers;

export default class BlockHashMapElement extends HashMapElement {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "blkMap",
                    fixedBytes: 6,
                },

                //height
                id:{
                    minSize: 1,
                    maxSize: 10,
                    fixedBytes: undefined,
                },

                //hash
                data: {

                    type: "buffer",
                    fixedBytes: 32,
                    minSize: undefined,
                    maxSize: undefined,

                },

            },

        }, schema, false), data, type, creationOptions);

    }

}