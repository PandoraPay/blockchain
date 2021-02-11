const {Helper, Exception} = require('kernel').helpers;

const BaseChainDataModel = require( "../../base/base-chain-data-model");
const BlockModel = require( "../../../block/block-model")

const {SubChainDataSchemaBuilt} = require('./sub-chain-data-schema-build')

module.exports = class SubChainDataModel extends BaseChainDataModel {

    constructor(scope, schema = SubChainDataSchemaBuilt, data, type , creationOptions){

        super(scope, schema, data, type, creationOptions);

        if (!this.hashes) this.hashes = {};
        if (!this.kernelHashes) this.kernelHashes = {};
        if (!this.blocks) this.blocks = {};

    }

    async clearData(){

        await super.clearData(this);

        this.listBlocks = [];
        this.blocks = {};

        this.listKernelHashes = [];
        this.kernelHashes = {};

        this.listHashes = [];
        this.hashes = {};

    }

    async _getBlockByHeight( height  = this.end - 1){

        if (this.blocks[height])
            return this.blocks[height];

        return this._fallback._getBlockByHeight(height);

    }

    async _getBlockByHash(hash){

        if (this.hashes[hash])
            return this.hashes[hash];

        return this._fallback. _getBlockByHash(hash);
    }

    async _getBlockHashByHeight(height){

        if (this.blocks[height])
            return this.blocks[height].hash();

        return this._fallback._getBlockHashByHeight(height);
    }

    async _getBlockInfoByHash(hash){

        if (this.hashes[hash]){
            const block = await this._getBlockByHash(hash);
            return block.getBlockInfo();
        }

        return this._fallback._getBlockInfoByHash(hash);
    }

    async _deleteBlockByHeight(height){
        throw new Exception(this, "not implemented")
    }

}