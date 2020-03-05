import TokenHashMapElement from "./token-hash-map-element";

const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

/**
 * Required for consensus.
 * Stores tokens
 *
 */

export default class TokenHashVirtualMap extends HashVirtualMap {

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

    processLeafLabel(label){

        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length === 0) throw new Exception(this, "label length is invalid");

        if (label.length !== 40) throw "label is not leaf";

        return label;
    }

    async getTokenNode( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.getMap(publicKeyHash);

        return out ? out.data : undefined;

    }

    async updateTokenSupply(publicKeyHash, value){

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.getMap(publicKeyHash);

    }

}