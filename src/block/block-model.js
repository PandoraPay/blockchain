const {DBModel} = require('kernel').db;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;
const {BN} = require('kernel').utils;

const {BlockSchemaBuilt} = require('./block-schema-build')

module.exports = class BlockModel extends DBModel {

    constructor(scope, schema = BlockSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

    get work(){
        return this.difficulty;
    }

    async _validateBlockInfo(chain = this._scope.chain, chainData = chain.data){

        /**
         * validate time
         */

        const networkTimestampDrift = this._scope.genesis.settings.getDateNow() + this._scope.argv.block.timestamp.timestampDriftMaximum;
        if ( this.timestamp >  networkTimestampDrift )
            throw new Exception(this, "timestamp drift is to big", {timestamp:this.timestamp, networkTimestampDrift: networkTimestampDrift });

        const timestamp = await chainData.getBlockTimestamp( this.height - 1 );
        if ( this.timestamp < timestamp )
            throw new Exception( this, "Timestamp is less than last median blocks", { timestamp: this.timestamp, medianTimestamp: timestamp } );

        /**
         * validate prevHash
         */
        const prevBlockHash = await chainData.getBlockHash(this.height-1);
        if (!this.prevHash.equals(  prevBlockHash ))
            throw new Exception(this, "prevHash doesn't match", {prevHash: this.prevHash, prevBlockHash });

        /**
         * validate target
         */
        const nextTarget = await chainData.nextTarget( this.height - 1 );
        if (!this.target.equals( nextTarget ))
            throw new Exception(this, "target doesn't match", {target: this.target, nextTarget });

        /**
         * Validate prevKernelHash
         */

        if (!this.prevKernelHash.equals( await chainData.getBlockKernelHash(this.height-1)  ))
            return false;

        return true;

    }

    async validateBlock(chain = this._scope.chain, chainData = chain.data){

        if (await this._validateBlockInfo(chain, chainData) !== true) return false;

        /**
         * Validate POS
         */

        if (!chain.isForkSubChain)
            if (await this.pos.validatePOS(chain, chainData) !== true ) return false;

        /**
         * validate Merkle tree
         */
        
        if (await this.transactionsMerkleTree.validateMerkleTree( chain, chainData, this ) !== true) return false;

        /**
         * validate the number of tokens in the block
         */
        if (this.newTokens !== await this.transactionsMerkleTree.newTokensCount() ) return false;

        /**
         * validate pos
         */

        if (this.kernelHash().compare ( this.target ) > 0)
            throw new Exception(this, "kernel hash is invalid");


        const totalDifficulty = await this.computeTotalDifficulty(chain, chainData);
        if ( !this.totalDifficulty.eq(totalDifficulty) )
            throw new Exception(this, "total difficulty doesn't match");

        return true;
    }

    async computeTotalDifficulty(chain = this._scope.chain, chainData = chain.data){

        const prevTotalDifficulty = this.height ? await chainData.getBlockTotalDifficulty( this.height -1 ) : new BN(0);
        const totalDifficulty = prevTotalDifficulty.add( this.difficulty );
        return totalDifficulty;

    }

    async addBlock(chain = this._scope.chain, chainData = chain.data){

        //update transactions
        if (!chain.isForkSubChain) {
            if (await this.transactionsMerkleTree.transactionsMerkleTreeInclude(chain, chainData, this) !== true) return false;

            if (await this.pos.addBlockPOS(chain, chainData, this) !== true) return false;
        }


        return true;

    }

    async removeBlock(chain = this._scope.chain, chainData = chain.data){

        if (!chain.isForkSubChain) {
            if (await this.pos.removeBlockPOS(chain, chainData, this) !== true) return false;

            if (await this.transactionsMerkleTree.transactionsMerkleTreeRemove(chain, chainData, this) !== true) return false;
        }

        return true;
    }

    async successfullyAdded(chain = this._scope.chain, chainData = chain.data){

        /**
         * Store hash into HashMap
         */
        await chainData.blockByHeightMap.updateMap( this.height.toString(), {
            blockHash: this.hash()
        } );

        /**
         * Store block height into blockByHashMap
         */
        await chainData.blockByHashMap.updateMap( this.hash().toString("hex"), {
            height: this.height
        } );

        /**
         * Store block extra information into blockInfo
         */
        await chainData.blockInfoByHashMap.updateMap( this.hash().toString("hex"), {
            blockHash: this.hash(),
            kernelHash: this.kernelHash(),
            prevHash: this.prevHash,
            prevKernelHash: this.prevKernelHash,
            height: this.height,
            timestamp: this.timestamp,
            size: this.size(),
            txs: this.txCount(),
            stakeForgerPublicKey: this.pos.stakeForgerPublicKey,
            totalDifficulty: this.totalDifficulty,
        }, "object", {skipProcessingConstructionValues: true});

        if (!chain.isForkSubChain)
            await this.transactionsMerkleTree.transactionsMerkleTreeSuccessfullyAdded(chain, chainData, this);
        
    }

    async successfullyRemoved(chain = this._scope.chain, chainData = chain.data){

        if (!chain.isForkSubChain)
            await this.transactionsMerkleTree.transactionsMerkleTreeSuccessfullyRemoved(chain, chainData, this);

        /**
         * Remove hash from HashMap
         */
        await chainData.blockByHeightMap.deleteMap( this.height.toString() );

        /**
         * Remove block height from blockByHashMap
         */

        await chainData.blockByHashMap.deleteMap( this.hash().toString("hex") );

        /**
         * Remove block info from blockInfoByHashMap
         */
        await chainData.blockInfoByHashMap.deleteMap( this.hash().toString("hex") );


    }

    reward(){
        return this._scope.argv.transactions.coinbase.getBlockRewardAt( this.height, 1 )
    }

    async sumFees(){
        return this.transactionsMerkleTree.sumFees();
    }

    async getTransactions(){
        return this.transactionsMerkleTree.getTransactions();
    }

    kernelHash(){
        return this.pos.kernelHash();
    }

    size(){
        return this.toBuffer().length;
    }

    txCount(){
        return this.transactionsMerkleTree.txCount();
    }

    newTokensCount(){
        return this.newTokens;
    }

    async txIds(){
        return this.transactionsMerkleTree.txIds();
    }

    timestampReal(){
        return this._scope.genesis.settings.timestamp + this.timestamp;
    }

    async calculateAddressesChanged(addresses){

        const stakeForgerPublicKeyHash = this.pos.stakeForgerPublicKeyHash.toString("hex");
        if (!addresses[ stakeForgerPublicKeyHash ]) addresses[ stakeForgerPublicKeyHash ] = true;

        await this.transactionsMerkleTree.calculateAddressesChanged(addresses);
    }

}