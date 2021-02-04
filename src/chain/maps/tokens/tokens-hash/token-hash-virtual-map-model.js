const {HashVirtualMapModel} = require('kernel').dataStructures.hashMap;
const {TxTokenCurrencyTypeEnum} = require('cryptography').transactions;
const {Helper, Exception, StringHelper, EnumHelper} = require('kernel').helpers;

const {TokenHashMapElementSchemaBuilt} = require( "./token-hash-map-element-schema-build");

/**
 * Required for consensus.
 * Stores tokens
 */

module.exports = class TokenHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema = TokenHashMapElementSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    processLeafLabel(label){

        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length === 0) throw new Exception(this, "label length is invalid");

        if (label.length !== 40) throw "label is not leaf";

        return label;
    }

    async currencyExists(tokenPublicKeyHash){

        if (!Buffer.isBuffer(tokenPublicKeyHash) && StringHelper.isHex(tokenPublicKeyHash) ) tokenPublicKeyHash = Buffer.from(tokenPublicKeyHash, "hex");

        if ( EnumHelper.validateEnum( tokenPublicKeyHash.toString("hex") , TxTokenCurrencyTypeEnum) ) return true; //00 token

        const exists = await this.getTokenNode(tokenPublicKeyHash);

        if (exists) return true; //user created token

        throw new Exception(this, "Token Currency was not found");
    }

    async getTokenNode( tokenPublicKeyHash ){

        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);
        const out = await this.getMap(tokenPublicKeyHash);

        return out;
    }

    async updateTokenSupply(tokenPublicKeyHash, value){

        if (value === 0) throw new Exception(this, "value needs to be different than zero");

        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);

        const node = await this.getMap(tokenPublicKeyHash);

        if (node){

            const supply = node.supply;

            if (supply + value < 0) throw new Exception(this, "supply would become negative", {supply, value});
            if (supply + value > node.maxSupply) throw new Exception(this, "supply would exceed max supply", {supply, value});

            node.supply = supply + value;

            node.save();

            return node.supply;

        } else {
            throw new Exception(this, "Token doesn't exist", {tokenPublicKeyHash});
        }

    }

}