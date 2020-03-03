
const {MarshalData} = global.kernel.marshal;
const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception} = global.kernel.helpers;
const {BN, BigNumber} = global.kernel.utils;
const {StringHelper} = global.networking.sockets.protocol;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;
const {SimpleTransaction} = global.cryptography.transactions.simpleTransaction;

import TxHashVirtualMap from "src/chain/maps/txs/tx-hash/tx-hash-virtual-map";
import AddressHashVirtualMap from "src/chain/maps/addresses/addresses-hash/address-hash-virtual-map";
import AddressTxHashVirtualMap from "src/chain/maps/addresses/addresses-tx-hash/address-tx-hash-virtual-map";

import BlockHashVirtualMap from "../maps/blocks/block-hash-map/block-hash-virtual-map";
import HashBlockVirtualMap from "../maps/blocks/hash-block-map/hash-block-virtual-map";
import AccountHashVirtualMap from "../maps/account-hash/account-hash-virtual-map";
import TokenHashVirtualMap from "../maps/tokens-hash/token-hash-virtual-map";

const MAX_CHANGE_FACTOR = 2;
const MIN_CHANGE_FACTOR = 1 / MAX_CHANGE_FACTOR;

export default class BaseChainData extends DBSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "basechain",
                        fixedBytes: 9,
                    },

                    version: {
                        type: "number",
                        default: 0,

                        position: 100,
                    },

                    /**
                     * Starting Height
                     */
                    start: {
                        type: "number",
                        default: 0,

                        position: 101,
                    },

                    /**
                     * Length of Blockchain
                     */
                    end: {
                        type: "number",
                        default: 0,

                        position: 102,
                    },

                    /**
                     * Number of transactions
                     */
                    transactionsIndex:{
                        type: "number",
                        default:0,

                        position: 103,
                    },

                    /**
                     * Total Work (sum of difficulties)
                     */
                    chainwork:{

                        type: "bigNumber",

                        // minsize: 0,
                        // maxsize: 2^256,

                        preprocessor(chainwork){
                            this.chainworkBuffer = MarshalData.compressBigNumber(chainwork);
                            return chainwork;
                        },

                        position: 104,
                    },


                    /**
                     * Hash of the entire chain
                     */
                    hash:{

                        type: "buffer",
                        fixedBytes: 32,

                        position: 105,
                    },

                    /**
                     * PrevHash of the entire chain
                     */
                    prevHash:{

                        type: "buffer",
                        fixedBytes: 32,

                        position: 106,
                    },

                    /**
                     * KernelHash of the last block
                     */
                    kernelHash:{

                        type: "buffer",
                        fixedBytes: 32,

                        removeLeadingZeros: true,

                        position: 107,
                    },

                    /**
                     * PrevKernelHash of the last block
                     */
                    prevKernelHash:{

                        type: "buffer",
                        fixedBytes: 32,

                        removeLeadingZeros: true,

                        position: 108,
                    },



                }

            },
            schema, false), data, type, creationOptions);

        this.addressHashMap = new this._addressHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.tokenHashMap = new this._tokenHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.addressTxHashMap = new this._addressTxHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.txHashMap = new this._txHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.blockHashMap = new this._blockHashMapClass({
            ...this._scope,
            chainData: this,
        });

        this.hashBlockMap = new this._hashBlockMapClass({
            ...this._scope,
            chainData: this,
        });

        this.accountHashMap = new this._accountHashMapClass({
            ...this._scope,
            chainData: this,
        });


        this._grindingLockedTransfersFunds = {};

    }

    get _addressHashMapClass(){
        return AddressHashVirtualMap;
    }

    get _tokenHashMapClass(){
        return TokenHashVirtualMap;
    }

    get _addressTxHashMapClass(){
        return AddressTxHashVirtualMap;
    }

    get _txHashMapClass(){
        return TxHashVirtualMap;
    }

    get _blockHashMapClass(){
        return BlockHashVirtualMap;
    }

    get _hashBlockMapClass(){
        return HashBlockVirtualMap;
    }

    get _accountHashMapClass(){
        return AccountHashVirtualMap;
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
        this.txHashMap.resetHashMap();
        this.addressHashMap.resetHashMap();
        this.addressTxHashMap.resetHashMap();
        this.blockHashMap.resetHashMap();
        this.hashBlockMap.resetHashMap();
        this.accountHashMap.resetHashMap();
        this.tokenHashMap.resetHashMap();
    }

    /**
     *  it needs to be locked !
     */
    async spliceBlocks( start ){

        let blocksRemoved = [];

        try{

            for (let i = this.end - 1; i >= start; i--) {

                const block = await this.getBlock( i );

                this.end = this.end - 1;
                this.chainwork = this.chainwork.sub(  block.work );

                this._scope.logger.info(this,'spliceBlocks', { transactionsIndex: this.transactionsIndex, txCount: block.txCount() });
                this.transactionsIndex = this.transactionsIndex - block.txCount();
                delete this._grindingLockedTransfersFunds[i];

                await block.removeBlock(this._scope.chain, this);

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
        this.hashBlockMap._fallback = mainChainData.hashBlockMap;

        this.txHashMap._fallback = mainChainData.txHashMap;
        this.addressHashMap._fallback = mainChainData.addressHashMap;
        this.addressTxHashMap._fallback = mainChainData.addressTxHashMap;

        this.accountHashMap._fallback = mainChainData.accountHashMap;
        this.tokenHashMap._fallback = mainChainData.tokenHashMap;

        this._fallback = mainChainData;

    }

    async getTransactionByHash(hash){
        throw new Exception(this, "Not implemented");
    }

    async getBlock( height = this.end-1){
        throw new Exception(this, "Not implemented");
    }

    async getBlockByHash(hash){
        throw new Exception(this, "Not implemented");
    }

    async getBlockHash(height = this.end - 1){
        const block = await this.getBlock(height);
        return block.hash();
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

    async _computeGrindingLockedTransfersFundsHeight(height){

        const txTokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer; //native id;

        const block = await this.getBlock(height);
        if (!block) throw new Exception(this, `Block couldn't get retrieved`, {height } );

        const transfers = {};

        const txs = await block.getTransactions();
        for (const tx of txs)
            if (tx instanceof SimpleTransaction && tx.tokenCurrency.equals(txTokenCurrency) ) {

                for (const vout of tx.vout)
                    transfers[vout.publicKeyHash.toString('hex')] =  (transfers[vout.publicKeyHash.toString('hex')] || 0) + vout.amount;

            }

        this._grindingLockedTransfersFunds[height] = transfers;

    }
    
    async _computeGrindingLockedTransfersFunds(){


        const startHeight = Math.max(0, this.end-1 - this._scope.argv.transactions.staking.stakingGrindingLockedTransfersBlocks );

        for (let height = startHeight; height < this.end; height++){

            if (!this._grindingLockedTransfersFunds[height])
                await this._computeGrindingLockedTransfersFundsHeight(height);

        }

        //clear old ones
        let height = startHeight-1;
        while (height >= 0 && this._grindingLockedTransfersFunds[height] ){
            delete this._grindingLockedTransfersFunds[height];
            height--;
        }


    }

    async getGrindingLockedTransfersFunds(publicKeyHash){

        if (typeof publicKeyHash === "string" && StringHelper.isHex(publicKeyHash)) publicKeyHash = Buffer.from(publicKeyHash, 'hex');

        if (!Buffer.isBuffer(publicKeyHash) || publicKeyHash.length !== 20) throw new Exception(this, 'PublicKeyHash is invalid');

        await this._computeGrindingLockedTransfersFunds();

        const publicKeyHashHex = publicKeyHash.toString('hex');

        const startHeight = Math.max(0, this.end-1 - this._scope.argv.transactions.staking.stakingGrindingLockedTransfersBlocks );

        let sum = 0;
        for (let height = startHeight; height < this.end; height++){
            const transfers = this._grindingLockedTransfersFunds[height];
            if (transfers[publicKeyHashHex])
                sum += transfers[publicKeyHashHex];
        }

        return sum;
    }

}
