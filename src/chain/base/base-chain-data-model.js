const {DBModel} = require('kernel').db;
const {Helper, Exception} = require('kernel').helpers;
const {BN, BigNumber} = require('kernel').utils;
const {StringHelper} = require('networking').sockets.protocol;
const {TxTokenCurrencyTypeEnum} = require('cryptography').transactions;
const {SimpleTxModel} = require('cryptography').transactions.simpleTransaction;

const BlockModel = require( "../../block/block-model");
const TxMerkleTreeNodeModel = require( "../../block/transactions/merkle-tree/tx-merkle-tree-node-model")

const TxInfoHashVirtualMapModel = require("../maps/txs/tx-info-hash/tx-info-hash-virtual-map-model");
const TxRevertInfoHashVirtualMapModel = require("../maps/txs/tx-revert-info-hash/tx-revert-info-hash-virtual-map-model");

const AddressHashVirtualMapModel = require("../maps/addresses/addresses-hash/address-hash-virtual-map-model");
const AddressTxHashVirtualMapModel = require("../maps/addresses/addresses-tx-hash/address-tx-hash-virtual-map-model");

const BlockByHashVirtualMapModel = require("../maps/blocks/block-by-hash-map/block-by-hash-virtual-map-model");
const BlockByHeightVirtualMapModel = require("../maps/blocks/block-by-height-map/block-by-height-virtual-map-model");
const BlockInfoByHashMapVirtualMapModel = require("../maps/blocks/block-info-by-hash-map/block-info-by-hash-virtual-map-model");
const AccountHashVirtualMapModel = require("../maps/account-hash/account-hash-virtual-map-model");
const TokenHashVirtualMapModel = require("../maps/tokens/tokens-hash/token-hash-virtual-map-model");
const TokenNameVirtualMapModel = require("../maps/tokens/tokens-name-map/token-name-virtual-map-model");
const TokenTickerVirtualMapModel = require("../maps/tokens/tokens-ticker-map/token-ticker-virtual-map-model");

const MAX_CHANGE_FACTOR = 2;
const MIN_CHANGE_FACTOR = 1 / MAX_CHANGE_FACTOR;

const {BaseChainDataSchemaBuilt} = require('./base-chain-data-schema-build')

module.exports = class BaseChainDataModel extends DBModel {

    constructor(scope, schema = BaseChainDataSchemaBuilt, data, type , creationOptions){

        super(scope, schema, data, type, creationOptions);
        this.resetCompleteData();

    }

    resetCompleteData(){

        this.accountHashMap = new this._accountHashMapClass({ ...this._scope,  chainData: this, });

        this.addressHashMap = new this._addressHashMapClass({ ...this._scope,  chainData: this, });
        this.addressTxHashMap = new this._addressTxHashMapClass({ ...this._scope,  chainData: this, });

        this.tokenHashMap = new this._tokenHashMapClass({ ...this._scope,  chainData: this, });
        this.tokenNameMap = new this._tokenNameMapClass({ ...this._scope,  chainData: this, });
        this.tokenTickerMap = new this._tokenTickerMapClass({ ...this._scope,  chainData: this, });

        this.txInfoHashMap = new this._txInfoHashMapClass({ ...this._scope,  chainData: this, });
        this.txRevertInfoHashMap = new this._txRevertInfoHashMapClass({ ...this._scope,  chainData: this, });

        this.blockByHashMap = new this._blockByHashMapClass({ ...this._scope,  chainData: this, });
        this.blockByHeightMap = new this._blockByHeightMapClass({ ...this._scope,  chainData: this, });
        this.blockInfoByHashMap = new this._blockInfoByHashMapClass({ ...this._scope,  chainData: this, });

        this.start = 0;
        this.end = 0;
        this.transactionsIndex = 0;
        this.tokensIndex = 0;
        this.circulatingSupply = 0;
        this.chainwork = new BN(0);
        this.hash = Buffer.alloc(32);
        this.prevHash = Buffer.alloc(32);
        this.kernelHash = Buffer.alloc(32);
        this.prevKernelHash = Buffer.alloc(32);

        this._grindingLockedTransfersFunds = {};
        this.clearOnlyLocalBlocks();

    }

    async importBlock(block){

        this.blocksMapByHeight[block.height] = block;
        this.blocksMapByHash[block.hash().toString("hex")] = block;

        const txs = await block.getTransactions();
        for (let i=0; i < txs.length; i++) {
            const tx = txs[i];
            this.transactionsMapByHash[ tx.hash().toString("hex") ] = {
                block: block.height,
                blockTimestamp: block.timestamp,
                merkleLeafHeight: i,
                tx,
            };
        }

        this.end = this.end + 1;
        this.transactionsIndex = this.transactionsIndex + block.txCount();
        this.tokensIndex = this.tokensIndex + await block.newTokensCount();
        this.chainwork = this.chainwork.add(  block.work );
        this.hash = block.hash();
        this.prevHash = block.prevHash;
        this.kernelHash = block.kernelHash();
        this.prevKernelHash = block.prevKernelHash;
    }

    clearOnlyLocalBlocks(){
        this.blocksMapByHeight = {};
        this.blocksMapByHash = {};
        this.transactionsMapByHash = {};
    }

    get _addressHashMapClass(){
        return AddressHashVirtualMapModel;
    }

    get _tokenHashMapClass(){
        return TokenHashVirtualMapModel;
    }

    get _tokenNameMapClass(){
        return TokenNameVirtualMapModel;
    }

    get _tokenTickerMapClass(){
        return TokenTickerVirtualMapModel;
    }

    get _addressTxHashMapClass(){
        return AddressTxHashVirtualMapModel;
    }

    get _txInfoHashMapClass(){
        return TxInfoHashVirtualMapModel;
    }

    get _txRevertInfoHashMapClass(){
        return TxRevertInfoHashVirtualMapModel;
    }

    get _blockByHashMapClass(){
        return BlockByHashVirtualMapModel;
    }

    get _blockByHeightMapClass(){
        return BlockByHeightVirtualMapModel;
    }

    get _blockInfoByHashMapClass(){
        return BlockInfoByHashMapVirtualMapModel;
    }

    get _accountHashMapClass(){
        return AccountHashVirtualMapModel;
    }

    async loadData(){

        if ( await this.exists() )
            await this.load();

        return true;
    }

    async clearData(){

        if ( await this.exists() )
            await this.delete();

    }

    async saveState(){

        //all hashes are saved

    }

    resetState(){
        this.txInfoHashMap.resetHashMap();
        this.txRevertInfoHashMap.resetHashMap();
        this.addressHashMap.resetHashMap();
        this.addressTxHashMap.resetHashMap();
        this.blockByHashMap.resetHashMap();
        this.blockByHeightMap.resetHashMap();
        this.blockInfoByHashMap.resetHashMap();
        this.accountHashMap.resetHashMap();
        this.tokenHashMap.resetHashMap();
        this.tokenTickerMap.resetHashMap();
        this.tokenNameMap.resetHashMap();
    }

    /**
     *  it needs to be locked !
     */
    async spliceBlocks( chain = this._scope.chain, start ){

        let blocksRemoved = [];

        try{

            for (let i = this.end - 1; i >= start; i--) {

                const block = await this.getBlockByHeight( i );

                this.end = this.end - 1;
                this.chainwork = this.chainwork.sub(  block.work );

                this._scope.logger.info(this,'spliceBlocks', { height:i, transactionsIndex: this.transactionsIndex, tokensIndex: this.tokensIndex, txCount: block.txCount() });
                this.transactionsIndex = this.transactionsIndex - block.txCount();
                this.tokensIndex = this.tokensIndex - block.newTokensCount();

                if (this._grindingLockedTransfersFunds[block.height] && !this._grindingLockedTransfersFunds[block.height].hash.equals( block.hash() ) )
                    throw new Exception(this, 'grinding hash is not matching');

                delete this._grindingLockedTransfersFunds[block.height];

                await block.removeBlock( chain, this);

                blocksRemoved.push( block );
            }

        } catch (err){
            this._scope.logger.error(this, "spliceBlocks raised an error", err);
            return;
        }


        return blocksRemoved

    }

    async nextTarget( height = this.data.end, ){

        const blockWindow = height >= this._scope.argv.block.difficulty.blockWindow ? this._scope.argv.block.difficulty.blockWindow : Math.max( height, 1) ;
        const first = Math.max( 0, height - this._scope.argv.block.difficulty.blockWindow ) ;
        const last = height ;

        const firstTotalDifficulty = height ? await this.getBlockTotalDifficultyByHeight(first) : 0;
        const lastTotalDifficulty = await this.getBlockTotalDifficultyByHeight(last);

        let totalDifficulty = new BigNumber( lastTotalDifficulty.toString(16), 16).minus( new BigNumber(firstTotalDifficulty.toString(16), 16 ) );

        let actualTime = await this.getBlockTimestampByHeight(last) - await this.getBlockTimestampByHeight(first);

        if ( last <= this._scope.argv.block.difficulty.blockWindow )
            actualTime += ( this._scope.argv.block.difficulty.blockWindow - last ) * this._scope.argv.block.difficulty.blockTime;

        const averageDifficulty = totalDifficulty.dividedBy( blockWindow );
        const averageTarget = new BigNumber(this._scope.argv.block.difficulty.maxTargetBigNumber.toString(16), 16 ) .dividedBy(averageDifficulty);

        const expectedTime = this._scope.argv.block.difficulty.blockTime * this._scope.argv.block.difficulty.blockWindow;
        let change = new BigNumber(actualTime).dividedBy( expectedTime );

        change = BigNumber.max(change, MIN_CHANGE_FACTOR );
        change = BigNumber.min(change, MAX_CHANGE_FACTOR );

        let newTarget = averageTarget.times(change).decimalPlaces(0);
        newTarget = BigNumber.min( newTarget, this._scope.argv.block.difficulty.maxTargetBigNumber );
        newTarget = BigNumber.max( newTarget, 1 );

        const newTargetHex = newTarget.toString(16);

        const newTargetHexFinal = Array(2 * this._scope.argv.block.hashSize - newTargetHex.length + 1 ).join('0') + newTargetHex;

        return Buffer.from( newTargetHexFinal, "hex");

    }

    setFallbacks(mainChainData){

        this.blockByHashMap._fallback = mainChainData.blockByHashMap;
        this.blockByHeightMap._fallback = mainChainData.blockByHeightMap;
        this.blockInfoByHashMap._fallback = mainChainData.blockInfoByHashMap;

        this.txInfoHashMap._fallback = mainChainData.txInfoHashMap;
        this.txRevertInfoHashMap._fallback = mainChainData.txRevertInfoHashMap;

        this.addressHashMap._fallback = mainChainData.addressHashMap;
        this.addressTxHashMap._fallback = mainChainData.addressTxHashMap;

        this.accountHashMap._fallback = mainChainData.accountHashMap;
        this.tokenHashMap._fallback = mainChainData.tokenHashMap;

        this.tokenNameMap._fallback = mainChainData.tokenNameMap;
        this.tokenTickerMap._fallback = mainChainData.tokenTickerMap;

        this._fallback = mainChainData;

    }

    async getBlockByHeight( height = this.end-1){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, end: this.end});

        return this._getBlockByHeight(height);
    }

    async _getBlockByHeight(height ){

        if (this.blocksMapByHeight[height]) return this.blocksMapByHeight[height];

        const block  = new BlockModel( this._scope, undefined, {
            height: height
        } );
        await block.load();

        return block;
    }

    async deleteBlockByHeight(height){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, length: this.length});

        return this._deleteBlockByHeight(height);
    }

    async _deleteBlockByHeight(height){

        if (this.blocksMapByHeight[height]){
            const block = this.blocksMapByHeight[height];
            delete this.blocksMapByHeight[height];
            delete this.blocksMapByHash[block.hash().toString('hex')];
            return true;
        }

        const block = await this._getBlockByHeight(height);
        await block.delete();
        return true;
    }

    async getBlockHashByHeight(height){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, length: this.length});

        return this._getBlockHashByHeight(height);
    }

    async _getBlockHashByHeight(height){

        if (this.blocksMapByHeight[height]) return this.blocksMapByHeight[height].hash();

        const element = await this.blockByHeightMap.getMap( height.toString() );
        if (!element) throw new Exception(this, "Block not found", {height});

        return element.blockHash;
    }

    async getBlockByHash( hash ){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (typeof hash !== "string" || hash.length !== 64) throw new Exception(this, 'Hash is invalid');

        return this._getBlockByHash(hash);
    }

    async _getBlockByHash(hash){

        if (this.blocksMapByHash[hash]) return this.blocksMapByHash[hash];

        const blockHeightInfo = await this.blockByHashMap.getMap( hash );
        if (!blockHeightInfo) throw new Exception(this, "Block not found", {hash});
        return this.getBlockByHeight(blockHeightInfo.height);
    }

    async getBlockInfoByHash(hash){
        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (typeof hash !== "string" || hash.length !== 64) throw new Exception(this, 'Hash is invalid');
        return this._getBlockInfoByHash(hash);
    }

    async _getBlockInfoByHash(hash){
        if (this.blocksMapByHash[hash]) return this.blocksMapByHash[hash].getBlockInfo();
        return this.blockInfoByHashMap.getMap(hash);
    }

    async getBlockInfoByHeight(height){
        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, length: this.length});
        return this._getBlockInfoByHeight(height);
    }

    async _getBlockInfoByHeight(height){
        const hash = await this._getBlockHashByHeight(height);
        return this._getBlockInfoByHash(hash.toString('hex'));
    }

    async getBlockTotalDifficultyByHeight(height = this.end - 1){
        const blockInfo = await this._getBlockInfoByHeight(height);
        return blockInfo.totalDifficulty;
    }

    async getBlockTimestampByHeight(height = this.end - 1){
        const blockInfo = await this._getBlockInfoByHeight(height);
        return blockInfo.timestamp;
    }


    async getBlockKernelHash(height){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, length: this.length});

        return this._getBlockKernelHash(height);
    }

    async _getBlockKernelHash(height){
        const blockInfo = await this._getBlockInfoByHeight(height);
        return blockInfo.kernelHash;
    }

    async getTransactionByHash(hash){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (!hash || hash.length !== 64) throw new Exception(this, "Hash is invalid");

        return this._getTransactionByHash(hash);
    }

    async _getTransactionByHash(hash, txInfo){

        if (this.transactionsMapByHash[hash])
            return this.transactionsMapByHash[hash].tx;

        if (!txInfo)
            txInfo = await this.txInfoHashMap.getMap( hash, );

        if (!txInfo) return;
        return this._getTxMerkleLeaf( txInfo.merkleHeight, txInfo.blockHeight);
    }

    async _getTxMerkleLeaf(merkleHeight, blockHeight){

        const txMerkleNode  = new TxMerkleTreeNodeModel( {
            ...this._scope,
            parent: {
                tree: {
                    levelsCounts: [merkleHeight],
                    levels: 0,
                },
                level: -1,
                _propagateChanges: a => a,
            },
            parentFieldName: "children",
        }, undefined, {  }, "object", {loading: true} );

        await txMerkleNode.load( merkleHeight.toString(), `block:b_${blockHeight}:TxMerkleTree` );
        return txMerkleNode.transaction;
    }

    async getTransactionWithInfoByHash(hash){

        if ( Buffer.isBuffer(hash) ) hash = hash.toString("hex");
        if (!hash || hash.length !== 64) throw new Exception(this, "Hash is invalid");

        return this._getTransactionWithInfoByHash(hash);
    }

    async _getTransactionWithInfoByHash(hash){

        if (this.transactionsMapByHash[hash])
            return this.transactionsMapByHash[hash];

        const txInfo = await this.txInfoHashMap.getMap( hash );
        if (!txInfo) return;

        const out = {
            block: txInfo.blockHeight,
            blockTimestamp: txInfo.blockTimestamp,
            merkleLeafHeight: txInfo.merkleLeafHeight,
        }

        out.tx = await this._getTransactionByHash( hash, txInfo);
        return out;
    }

    async _computeGrindingLockedTransfersFundsHeight(height){

        const tokenCurrency = TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer; //native id;

        const block = await this.getBlockByHeight(height);
        if (!block) throw new Exception(this, `Block couldn't get retrieved`, {height } );

        const transfers = {};

        const txs = await block.getTransactions();
        for (const tx of txs)
            if (tx instanceof SimpleTxModel ) {

                for (const vout of tx.vout)
                    if ( vout.tokenCurrency.equals( tokenCurrency ) )
                        transfers[vout.publicKeyHash.toString('hex')] =  (transfers[vout.publicKeyHash.toString('hex')] || 0) + vout.amount;

            }

        this._grindingLockedTransfersFunds[height] = { //it is mandatory to be immutable
            hash: block.hash(),
            transfers
        };

    }
    
    async _computeGrindingLockedTransfersFunds(){


        const startHeight = Math.max( 0, this.end - 1 - this._scope.argv.transactions.staking.stakingGrindingLockedTransfersBlocks );

        for (let height = startHeight; height < this.end; height++){

            if (!this._grindingLockedTransfersFunds[height])
                await this._computeGrindingLockedTransfersFundsHeight(height);

        }

        //clear old ones
        let height = startHeight-1;
        while (height >= 0 && this._grindingLockedTransfersFunds[height] ){
            const blockHash = await this.getBlockHashByHeight(height);
            if (!blockHash || !blockHash.equals( this._grindingLockedTransfersFunds[height].hash) )
                throw new Exception(this, 'BlockHash is not matching Grinding', {height});
            delete this._grindingLockedTransfersFunds[height];
            height--;
        }


    }

    async getGrindingLockedTransfersFunds(publicKeyHash){

        if (typeof publicKeyHash === "string" && StringHelper.isHex(publicKeyHash)) publicKeyHash = Buffer.from(publicKeyHash, 'hex');

        if (!Buffer.isBuffer(publicKeyHash) || publicKeyHash.length !== 20) throw new Exception(this, 'PublicKeyHash is invalid');

        await this._computeGrindingLockedTransfersFunds();

        const publicKeyHashHex = publicKeyHash.toString('hex');

        const startHeight = Math.max( 0, this.end - 1 - this._scope.argv.transactions.staking.stakingGrindingLockedTransfersBlocks );

        let sum = 0;
        for (let height = startHeight; height < this.end; height++){
            const transfers = this._grindingLockedTransfersFunds[height].transfers; // it is mandatory to be immutable
            if (transfers[publicKeyHashHex])
                sum += transfers[publicKeyHashHex];
        }

        return sum;
    }


}
