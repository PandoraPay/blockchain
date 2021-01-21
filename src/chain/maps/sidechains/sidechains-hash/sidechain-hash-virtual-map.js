import TokenHashMapElement from "../../tokens/tokens-hash/token-hash-map-element";
const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {Helper, Exception, EnumHelper} = global.kernel.helpers;

export default class SidechainHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenMap",
                    fixedBytes: 8,
                },

                element: {
                    classObject: TokenHashMapElement,
                },

            },


        }, schema, false), data, type, creationOptions);

    }

    processLeafLabel(label) {

        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length === 0) throw new Exception(this, "label length is invalid");

        if (label.length !== 40) throw "label is not leaf";

        return label;
    }

}