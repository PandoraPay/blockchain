const {SocketRouterPlugin} = PandoraLibrary.sockets.protocol;
const {Exception} = PandoraLibrary.helpers;

/**
 * https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
 */

module.exports = class BlockchainCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){
        super(scope);
    }

    getOneWayRoutes(){

        return {

            "blockchain/get-best-block-hash": {
                handle:  this._getBestBlockHash,
                maxCallsPerSecond:  50,
                descr: "Returns the hash of the best (tip) block in the longest block chain."
            },

            "blockchain/get-best-block-kernel-hash": {
                handle:  this._getBestBlockKernelHash,
                maxCallsPerSecond:  50,
                descr: "Returns the hash of the best (tip) block in the longest block chain."
            },

            "blockchain/get-best-block-hashes": {
                handle:  this._getBestBlockHashes,
                maxCallsPerSecond:  50,
                descr: "Returns the hash of the best (tip) block in the longest block chain."
            },

            "blockchain/get-block": {
                handle:  this._getBlockByHash,
                maxCallsPerSecond:  50,
                descr: "Returns information about the block with the given hash."
            },

            "blockchain/get-block-by-height": {
                handle:  this._getBlockByHeight,
                maxCallsPerSecond:  50,
                descr: "Returns the block with the given index."
            },

            "blockchain/get-block-count": {
                handle:  this._getBlockCount,
                maxCallsPerSecond:  50,
                descr: "Returns the number of blocks in the longest block chain."
            },

            "blockchain/get-block-info": {
                handle:  this._getBlockInfoByHeight,
                maxCallsPerSecond:  50,
                descr: "Returns little information in best-block-chain at <index>; index 0 is the genesis block"
            },

            "blockchain/get-block-hash": {
                handle:  this._getBlockHashByHeight,
                maxCallsPerSecond:  50,
                descr: "Returns hash of block in best-block-chain at <index>; index 0 is the genesis block"
            },

            "blockchain/get-block-kernel-hash": {
                handle:  this._getBlockKernelHash,
                maxCallsPerSecond:  50,
                descr: "Returns kernel hash of block in best-block-chain at <index>; index 0 is the genesis block"
            },

            "blockchain/get-block-hashes": {
                handle:  this._getBlockHashesByHeight,
                maxCallsPerSecond:  50,
                descr: "Returns hash and kernelHash of block in best-block-chain at <index>; index 0 is the genesis block"
            },

            "blockchain/get-difficulty": {
                handle:  this._getDifficulty,
                maxCallsPerSecond:  50,
                descr: "* Returns the proof-of-work difficulty as a multiple of the minimum difficulty."
            },

            "blockchain/get-info": {
                handle:  this._getInfo,
                maxCallsPerSecond:  50,
                descr: "Returns an object containing various state info."
            },

            "blockchain/invalidate-block": {
                handle:  this._getInfo,
                maxCallsPerSecond:  50,
                descr: "Permanently marks a block as invalid, as if it violated a consensus rule."
            },

            "blockchain/genesis": {
                handle:  this._getGenesis,
                maxCallsPerSecond:  200,
                descr: "Get Genesis."
            }

        }

    }

    _getBestBlockHash(){
        return this._scope.mainChain.data.hash;
    }

    _getBestBlockKernelHash(){
        return this._scope.mainChain.data.kernelHash;
    }

    _getBestBlockHashes(){
        return {
            hash: this._scope.mainChain.data.hash,
            kernelHash: this._scope.mainChain.data.kernelHash,
        };
    }

    async _getBlockInfoByHeight({index = this._scope.mainChain.data.end-1 }){

        const blockInfo = await this._scope.mainChain.data.getBlockInfoByHeight( index );

        return{

            height: blockInfo.height,
            timestamp: blockInfo.timestamp,
            size: blockInfo.size,
            txCount: blockInfo.txs,
            forgedBy:  blockInfo.stakeForgerPublicKey,
            hash: blockInfo.blockHash,
            kernelHash: blockInfo.kernelHash,

        };

    }
    
    async _getBlockByHeight({index = this._scope.mainChain.data.end-1, type = "buffer"}){
        
        const block = await this._scope.mainChain.data.getBlockByHeight( index );

        if (!block) throw Exception(this, "Block was not found", {index: index} );

        return block.toType(type);
        
    }

    async _getBlockByHash({hash, type = "buffer"}){

        const block = await this._scope.mainChain.data.getBlockByHash( hash );

        if (!block) throw Exception(this, "Block was not found", { hash: hash} );

        return await block.toType(type);

    }

    _getBlockCount(){
        return this._scope.mainChain.data.end;
    }

    async _getBlockHashByHeight( {index =  this._scope.mainChain.data.end-1 }, ){
        return this._scope.mainChain.data.getBlockHashByHeight( index );
    }

    async _getBlockKernelHash({index = this._scope.mainChain.data.end-1 }){
        return this._scope.mainChain.data.getBlockKernelHash( index );
    }

    async _getBlockHashesByHeight({index = this._scope.mainChain.data.end-1 }){

        const blockInfo = await this._scope.mainChain.data.getBlockInfoByHeight(index);

        return {
            hash: blockInfo.blockHash,
            kernelHash: blockInfo.kernelHash,
        };

    }


    _getDifficulty(){
        return this._scope.mainChain.totalDifficulty;
    }


    async _getInfo(){

        const chainData = this._scope.mainChain.data;

        return {
            start: chainData.start,
            blocks: chainData.end,
            hash: chainData.hash,
            kernelHash: chainData.kernelHash,
            prevHash: chainData.prevHash,
            prevKernelHash: chainData.prevKernelHash,
            chainwork: chainData.chainworkBuffer,
            connections: this._scope.masterCluster.totalPeers.count,
        }
    }

    async _getGenesis(){

        return {
            prevHash :  this._scope.genesis.prevHash,
            target : this._scope.genesis.target,
            prevKernelHash : this._scope.genesis.prevKernelHash,
            timestamp : this._scope.genesis.timestamp,
            timestampGenesis: this._scope.genesisSettings.timestamp,
            reward: this._scope.argv.transactions.coinbase.getBlockRewardAt( 0, 0 ),
        }

    }

}