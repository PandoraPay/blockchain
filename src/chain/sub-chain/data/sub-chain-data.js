const {Helper, Exception} = require('kernel').helpers;

const BaseChainDataDBModel = require( "../../base/base-chain-data-db-model");
const BlockDBModel = require( "../../../block/block-db-model")

const {SubChainDataDBSchemaBuilt} = require('./sub-chain-data-db-schema-build')

module.exports = class SubChainData extends BaseChainDataDBModel{

    constructor(scope, schema = SubChainDataDBSchemaBuilt, data, type , creationOptions){

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