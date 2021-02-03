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

    async getBlock( height  = this.end - 1){

        if (this.blocks[height])
            return this.blocks[height];

        return this._fallback.getBlock(height);

    }

    async getBlockByHash(hash){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");

        if (this.hashes[hash])
            return this.hashes[hash];

        return this._fallback.getBlockByHash(hash);
    }


    async getBlockHash(height){

        if (this.blocks[height])
            return this.blocks[height].hash();

        return this._fallback.getBlockHash(height);

    }
    
} 