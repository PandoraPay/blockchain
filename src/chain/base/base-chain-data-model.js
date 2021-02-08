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

const BlockHashVirtualMapModel = require("../maps/blocks/block-hash-map/block-hash-virtual-map-model");
const BlockHeightVirtualMapModel = require("../maps/blocks/block-height-map/block-height-virtual-map-model");
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

        this.addressHashMap = new this._addressHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.tokenHashMap = new this._tokenHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.tokenNameHashMap = new this._tokenNameMapClass({
            ...this._scope,
            chainData: this,
        });

        this.tokenTickerHashMap = new this._tokenTickerHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.addressTxHashMap = new this._addressTxHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.txInfoHashMap = new this._txInfoHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.txRevertInfoHashMap = new this._txRevertInfoHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.blockHashMap = new this._blockHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.blockHeightMap = new this._blockHeightMapClass({
            ...this._scope,
            chainData: this,
        });

        this.accountHashMap = new this._accountHashMapClass({
            ...this._scope,
            chainData: this,
        });

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

    get _tokenTickerHashMapClass(){
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

    get _blockHashMapClass(){
        return BlockHashVirtualMapModel;
    }

    get _blockHeightMapClass(){
        return BlockHeightVirtualMapModel;
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
        this.blockHashMap.resetHashMap();
        this.blockHeightMap.resetHashMap();
        this.accountHashMap.resetHashMap();
        this.tokenHashMap.resetHashMap();
        this.tokenTickerHashMap.resetHashMap();
        this.tokenNameHashMap.resetHashMap();
    }

    /**
     *  it needs to be locked !
     */
    async spliceBlocks( chain = this._scope.chain, start ){

        let blocksRemoved = [];

        try{

            for (let i = this.end - 1; i >= start; i--) {

                const block = await this.getBlock( i );

                this.end = this.end - 1;
                this.chainwork = this.chainwork.sub(  block.work );

                this._scope.logger.info(this,'spliceBlocks', { height:i, transactionsIndex: this.transactionsIndex, tokensIndex: this.tokensIndex, txCount: block.txCount() });
                this.transactionsIndex = this.transactionsIndex - block.txCount();
                this.tokensIndex = this.tokensIndex - block.newTokensCount();

                if (this._grindingLockedTransfersFunds[block.height].hash !== block.hash().toString('hex')  )
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

    async nextTarget( height = this.data.end ){

        const blockWindow = height >= this._scope.argv.block.difficulty.blockWindow ? this._scope.argv.block.difficulty.blockWindow : Math.max( height, 1) ;
        const first = Math.max( 0, height - this._scope.argv.block.difficulty.blockWindow ) ;
        const last = Math.max( 0, height  );

        const firstTotalDifficulty = height ? await this.getBlockTotalDifficulty(first) : 0;
        const lastTotalDifficulty = await this.getBlockTotalDifficulty(last);

        let totalDifficulty = new BigNumber( lastTotalDifficulty.toString(16), 16).minus( new BigNumber(firstTotalDifficulty.toString(16), 16 ) );

        let actualTime = await this.getBlockTimestamp(last) - await this.getBlockTimestamp(first);

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

        this.blockHashMap._fallback = mainChainData.blockHashMap;
        this.blockHeightMap._fallback = mainChainData.blockHeightMap;

        this.txInfoHashMap._fallback = mainChainData.txInfoHashMap;
        this.txRevertInfoHashMap._fallback = mainChainData.txRevertInfoHashMap;

        this.addressHashMap._fallback = mainChainData.addressHashMap;
        this.addressTxHashMap._fallback = mainChainData.addressTxHashMap;

        this.accountHashMap._fallback = mainChainData.accountHashMap;
        this.tokenHashMap._fallback = mainChainData.tokenHashMap;

        this.tokenNameHashMap._fallback = mainChainData.tokenNameHashMap;
        this.tokenTickerHashMap._fallback = mainChainData.tokenTickerHashMap;

        this._fallback = mainChainData;

    }

    async getBlock( height = this.end-1){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, end: this.end});

        return this._getBlock(height);
    }

    async _getBlock(height ){

        const block  = new BlockModel( this._scope, undefined, {
            height: height
        } );
        await block.load();

        return block;
    }

    async deleteBlock(height){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, length: this.length});

        return this._deleteBlock(height);
    }

    async _deleteBlock(height, block){
        if (!block) block = await this.getBlock(height);
        await block.delete();
        return true;
    }

    async getBlockByHash( hash ){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (typeof hash !== "string" || hash.length !== 64) throw new Exception(this, 'Hash is invalid');

        return this._getBlockByHash(hash);
    }

    async _getBlockByHash(hash){
        const blockInfo = await this.blockHashMap.getMap( hash );
        if (!blockInfo) throw new Exception(this, "Block not found", {hash});
        return this.getBlock(blockInfo.height);
    }

    async getBlockKernelHash(height = this.end - 1 ){
        const block = await this.getBlock(height);
        return block.kernelHash();
    }

    async getBlockTarget(height = this.end - 1){
        const block = await this.getBlock(height);
        return block.target;
    }

    async getBlockTotalDifficulty(height = this.end - 1){
        const block = await this.getBlock(height);
        return block.totalDifficulty;
    }

    async getBlockDifficulty(height = this.end - 1){
        const block = await this.getBlock(height);
        return block.difficulty;
    }

    async getBlockTimestamp(height = this.end - 1){
        const block = await this.getBlock(height);
        return block.timestamp;
    }

    async getBlockHash(height){

        if ( height < this.start ) throw new Exception(this, "Height is less than start", {height, start: this.start});
        if ( height >= this.end ) throw new Exception(this, "Height is higher than  length", {height, length: this.length});

        return this._getBlockHash(height);
    }

    async _getBlockHash(height){

        const element = await this.blockHeightMap.getMap( height.toString() );
        if (!element) throw new Exception(this, "Block not found", {height});

        return element.hash;
    }

    async getTransactionByHash(hash){

        if (Buffer.isBuffer(hash)) hash = hash.toString("hex");
        if (!hash || hash.length !== 64) throw new Exception(this, "Hash is invalid");

        return this._getTransactionByHash(hash);
    }

    async _getTransactionByHash(hash, txInfo){

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

        await txMerkleNode.load( merkleHeight.toString(), `block:b_${blockHeight}:Merkle:TxMerkleTree` );
        return txMerkleNode.transaction;
    }

    async getTransactionWithInfoByHash(hash){

        if ( Buffer.isBuffer(hash) ) hash = hash.toString("hex");
        if (!hash || hash.length !== 64) throw new Exception(this, "Hash is invalid");

        return this._getTransactionWithInfoByHash(hash);
    }

    async _getTransactionWithInfoByHash(hash){

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

        const block = await this.getBlock(height);
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
            hash: block.hash().toString('hex'),
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
            const blockHash = await this.getBlockHash(height);
            if (!blockHash || blockHash.toString('hex') !== this._grindingLockedTransfersFunds[height].hash )
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
