const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {TxTokenCurrencyTypeEnum} = PandoraLibrary.transactions;
const {Helper, Exception, StringHelper, EnumHelper} = PandoraLibrary.helpers;

const {TokenHashMapElementSchemaBuilt} = require( "./token-hash-map-element-schema-build");
const TokenHashMapElementModel = require( "./token-hash-map-element-model");

/**
 * Required for consensus.
 * Stores tokens
 */

module.exports = class TokenHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = TokenHashMapElementSchemaBuilt;
        this._childHashMapModel = TokenHashMapElementModel;
    }

    processLeafLabel(label){

        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length !== 40) throw new Exception(this, "label length is invalid");

        return label;
    }

    async currencyExists(tokenPublicKeyHash){

        if (!Buffer.isBuffer(tokenPublicKeyHash) && StringHelper.isHex(tokenPublicKeyHash) ) tokenPublicKeyHash = Buffer.from(tokenPublicKeyHash, "hex");
        if ( EnumHelper.validateEnum( tokenPublicKeyHash.toString("hex") , TxTokenCurrencyTypeEnum) ) return true; //00 token

        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);
        const exists = await this.existsMap(tokenPublicKeyHash);
        if (exists) return true;

        throw new Exception(this, "Token Currency was not found");
    }

    async getTokenNode( tokenPublicKeyHash ){
        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);
        return this.getMap(tokenPublicKeyHash);
    }

    async getTokenNodeData( tokenPublicKeyHash ){
        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);
        const node = await this.getMap(tokenPublicKeyHash);
        return node.data;
    }

    async updateNativeCoinSupply(value = 0){

        if (value === 0) throw new Exception(this, "value needs to be different than zero");

        const node = await this.getMap(TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idLong );
        if (!node) throw new Exception(this, "node was not found");

        const supply = node.data.supply;

        if (supply + value > node.maxSupply) throw new Exception(this, "supply would exceed max supply", {supply, value});
        node.data.supply = supply + value;

        await this.updateMap( TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idLong, node );

        return node.data.supply;
    }

    async updateTokenSupply(tokenPublicKeyHash, value = 0){

        if (value === 0) throw new Exception(this, "value needs to be different than zero");

        tokenPublicKeyHash = this.processLeafLabel(tokenPublicKeyHash);

        const node = await this.getMap(tokenPublicKeyHash);
        if (!node) throw new Exception(this, "node was not found");

        if (value < 0 && !node.canBurn ) throw new Exception(this, "supply can not be burned");
        if (value > 0 && !node.canMint ) throw new Exception(this, "supply can not be minted");

        const supply = node.data.supply;

        if (supply + value < 0) throw new Exception(this, "supply would become negative", {supply, value});
        if (supply + value > node.data.maxSupply) throw new Exception(this, "supply would exceed max supply", {supply, value});

        node.data.supply = supply + value;

        await this.updateMap( tokenPublicKeyHash, node );

        return node.data.supply;

    }

}