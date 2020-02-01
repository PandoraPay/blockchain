import TransactionsMerkleTree from "./transactions/merkle-tree/transactions-merkle-tree";

const {DBSchema} = global.kernel.marshal.db;
const {Helper, EnumHelper, Exception} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;
const {BN} = global.kernel.utils;

import BlockVersionEnum from "./block-version-enum"
import BlockPoS from "./pos/block-pos"

export default class Block extends DBSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "block",
                        fixedBytes: 5,
                    },


                    /**
                     * Height of the block
                     */
                    height: {

                        type: "number",

                        position: 100,

                    },

                    /**
                     * Id is just the block height as it is unique
                     */
                    id: {
                        default(){
                            return "b_"+this.height.toString();
                        },
                        maxSize: 12,
                        minSize: 3,

                        position: 101,
                    },


                    /**
                     * Block Version
                     */
                    version:{

                        type: "number",
                        maxSize: 1 << 16, //2 bytes
                        minSize: 0,

                        default(){

                            if (this.height >= 0)
                                return BlockVersionEnum.DEFAULT_BLOCK;

                        },

                        validation(version){
                            return EnumHelper.validateEnum(version, BlockVersionEnum);
                        },

                        position: 102,

                    },

                    /**
                     * Block Prev Hash. Usually it contains many leading zeros
                     */
                    prevHash: {

                        type: "buffer",
                        fixedBytes: scope.argv.block.hashSize,

                        position: 103,
                    },

                    /**
                     * prevKernelHash
                     */

                    prevKernelHash: {

                        type: "buffer",
                        fixedBytes: scope.argv.block.hashSize,

                        removeLeadingZeros: true,

                        position: 104,

                    },


                    /**
                     * Unix epoch time recorded for block
                     */
                    timestamp: {

                        type: "number",

                        position: 105,

                    },

                    /**
                     * Block Target Threshold
                     */

                    target: {

                        type: "buffer",
                        fixedBytes: 32,

                        removeLeadingZeros: true,

                        default(){
                            return this._scope.argv.block.difficulty.maxTargetBuffer;
                        },

                        preprocessor(target){

                            const targetBigNumber = new BN( target.toString("hex"), 16);

                            if (targetBigNumber.eq( new BN(0) ))
                                this.difficulty = new BN(0);
                            else
                                this.difficulty = this._scope.argv.block.difficulty.maxTargetBigNumber.div( targetBigNumber );

                            return target;

                        },

                        position: 106,

                    },

                    totalDifficulty: {

                        type: "bigNumber",

                        position: 107,
                    },

                    transactionsMerkleTree: {

                        type: "object",
                        classObject: TransactionsMerkleTree,

                        position: 108,
                    },

                    accountTreeHash:{

                        type: "buffer",
                        fixedBytes: 32,

                        position: 109

                    },

                    pos:{
                        type: "object",
                        classObject: BlockPoS,

                        position: 200,
                    },


                },

                options: {

                    hashing: {
                        enabled: true,

                        fct: CryptoHelper.dkeccak256,

                    },

                }

            },
            schema, false), data, type, creationOptions);

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

        if ( this.timestamp < await chainData.getBlockTimestamp( this.height - 1 ) )
            throw new Exception( this, "Timestamp is less than last median blocks", { timestamp: this.timestamp  } );

        /**
         * validate prevHash
         */
        if (!this.prevHash.equals( await chainData.getBlockHash(this.height-1)  ))
            throw new Exception(this, "prevHash doesn't match", {prevHash: this.prevHash });

        /**
         * validate target
         */
        if (!this.target.equals( await chainData.nextTarget( this.height - 1 ) ))
            throw new Exception(this, "target doesn't match", {target: this.target });

        /**
         * Validate prevKernelHash
         */

        if (!this.prevKernelHash.equals( await chainData.getBlockKernelHash(this.height-1)  ))
            return false;

        return true;

    }

    async validateBlock(chain = this._scope.chain, chainData = chain.data){

        if (await this._validateBlockInfo(chain, chainData) === false) return false;

        /**
         * Validate POS
         */

        if (await this.pos.validatePOS(chain, chainData) === false ) return false;

        /**
         * validate Merkle tree
         */
        
        if (await this.transactionsMerkleTree.validateMerkleTree( chain, chainData, this ) === false) return false;

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

    /**
     * Calculate Hash of Account Tree and revert it back
     * @param chain
     * @returns {Promise<void>}
     */
    async calculateAccountTreeHash(chain = this._scope.chain, chainData = chain.data){

        if ( await this.addBlock(chain, chainData, false) !== true) throw new Exception(this, "calculateAccountTreeHash - addBlock raised an error");

        const hash = chainData.accountTree.hash();

        //console.log("account hash", hash.toString("hex") );

        if ( await this.removeBlock(chain, chainData) !== true) throw new Exception(this, "calculateAccountTreeHash - removeBlock raised an error");

        return hash;

    }

    async addBlock(chain = this._scope.chain, chainData = chain.data, verifyAccountTreeHash = true ){

        //update transactions
        if (await this.transactionsMerkleTree.transactionsMerkleTreeInclude(chain, chainData, this) !== true) return false;

        //update miner balance with coinbase reward
        try{

            await chainData.accountTree.updateBalance( this.pos.stakeForgerPublicKeyHash, this._scope.argv.transactions.coinbase.getBlockRewardAt( this.height ) );

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, 'Error Updating reward balance');

            return false;
        }


        if (verifyAccountTreeHash){
            const hash = chainData.accountTree.hash();

            if ( !hash.equals(this.accountTreeHash) ){

                if (this._scope.argv.debug.enabled)
                    this._scope.logger.error(this, 'Block AccountTree Hash is not matching');

                return false;
            }
        }

        return true;

    }

    async removeBlock(chain = this._scope.chain, chainData = chain.data){

        await chainData.accountTree.updateBalance( this.pos.stakeForgerPublicKeyHash, - this._scope.argv.transactions.coinbase.getBlockRewardAt( this.height ) );

        if ( await this.transactionsMerkleTree.transactionsMerkleTreeRemove(chain, chainData, this) !== true)  return false;

        return true;
    }

    async successfullyAdded(chain = this._scope.chain, chainData = chain.data){

        /**
         * Store hash into HashMap
         */
        await chainData.blockHashMap.updateMap( this.height.toString(), this.hash() );

        /**
         * Store block height into BlockHashMap
         */
        await chainData.hashBlockMap.updateMap( this.hash().toString("hex"), Number.parseInt(this.height) );


        await this.transactionsMerkleTree.transactionsMerkleTreeSuccessfullyAdded(chain, chainData, this);
        
    }

    async successfullyRemoved(chain = this._scope.chain, chainData = chain.data){

        await this.transactionsMerkleTree.transactionsMerkleTreeSuccessfullyRemoved(chain, chainData, this);

        /**
         * Remove hash from HashMap
         */
        await chainData.blockHashMap.deleteMap( this.height.toString() );

        /**
         * Remove block height from BlockHashMap
         */

        await chainData.hashBlockMap.deleteMap( this.hash().toString("hex") );


    }

    reward(){
        return this._scope.argv.transactions.coinbase.getBlockRewardAt( this.height )
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