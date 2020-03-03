const {Helper, Exception} = global.kernel.helpers;
const {DBSchemaString} = global.kernel.marshal.db.samples;

import BaseChainData from "../../base/base-chain-data";
import Block from "src/block/block"

import SubChainDataHashUnique from "./hash/sub-chain-data-hash-unique";
import SubChainDataKernelHashUnique from "./hash/sub-chain-data-kernel-hash-unique";

export default class SubChainData extends BaseChainData{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "chain",
                        fixedBytes: 5,
                    },

                    version: {
                        default: 0,
                    },

                    listBlocks: {
                        type: "array",
                        maxSize: scope.argv.blockchain.maxForkAllowed,
                        classObject: Block,

                        position: 200,
                    },

                    listHashes: {
                        type: "array",
                        maxSize: scope.argv.blockchain.maxForkAllowed,

                        classObject: SubChainDataHashUnique,

                        position: 201,
                    },

                    listKernelHashes: {
                        type: "array",
                        maxSize: scope.argv.blockchain.maxForkAllowed,
                        classObject: SubChainDataKernelHashUnique,

                        position: 202,
                    },

                }

            },
            schema, false), data, type, creationOptions);

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