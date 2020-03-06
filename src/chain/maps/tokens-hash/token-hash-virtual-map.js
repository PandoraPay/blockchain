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

    async currencyExists(tokenPublicKeyHash){

        if (!Buffer.isBuffer(tokenPublicKeyHash) && StringHelper.isHex(tokenPublicKeyHash) ) tokenPublicKeyHash = Buffer.from(tokenPublicKeyHash, "hex");

        if ( EnumHelper.validateEnum( tokenPublicKeyHash.toString("hex") , TransactionTokenCurrencyTypeEnum) ) return true; //00 token

        const exists = await this.getTokenNode(tokenPublicKeyHash);

        if (exists) return true; //user created token

        throw new Exception(this, "Token Currency was not found");
    }

    async getTokenNode( tokenPublicKeyHash ){

        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);
        const out = await this.getMap(tokenPublicKeyHash);

        return out ? out.data : undefined;

    }

    async updateTokenSupply(tokenPublicKeyHash, value){

        if (value === 0) throw new Exception(this, "value needs to be different than zero");

        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);

        const node = await this.getMap(tokenPublicKeyHash);

        if (node){

            const supply = node.data.supply;

            if (supply + value < 0) throw new Exception(this, "supply would become negative", {supply, value});
            if (supply + value > node.data.maxSupply) throw new Exception(this, "supply would exceed max supply", {supply, value});

            node.data.supply = supply + value;

            node.save();

            return node.data.supply;

        } else {
            throw new Exception(this, "Token doesn't exist", {tokenPublicKeyHash});
        }

    }

}