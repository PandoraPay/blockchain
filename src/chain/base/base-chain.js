const {BN} = require('kernel').utils;

const {AsyncEvents} = require('kernel').helpers.events;
const {Helper, Exception} = require('kernel').helpers;

const Block = require("../../block/block");
const BaseChainData = require("./base-chain-data")
const TransactionsCreator = require("../../transactions/creator/transactions-creator")
const TransactionsValidator = require( "../../transactions/validator/transactions-validator");

module.exports = class BaseChain extends AsyncEvents{

    constructor(scope){

        super();

        this._scope = {
            ...scope,
            chain: this,
        };

        this.data = this.createData();

        this.transactionsCreator = new TransactionsCreator( this._scope );

        this.transactionsValidator = new TransactionsValidator(this._scope );

    }

    createData(){
        return new this._chainDataClass( this._scope );
    }

    cloneData(){
        const data = this.createData();
        data.fromObject( this.data.toJSON() );
        data._grindingLockedTransfersFunds = Helper.merge( {}, this.data._grindingLockedTransfersFunds, true );
        data.setFallbacks(this.data);
        return data;
    }

    async _clearChainData(){

        if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMaster)
            await this.data.clearData();

        this.data.resetCompleteData();

    }

    async clearChain(){
        await this._clearChainData();
    }

    async addBlocks(blocks){

    }

    async saveChain(){

    }

    async createBlock( height = this.data.end, chainData = this.data  ){

        let block;
        try{

            const prevBlock = height ? await chainData.getBlock(height-1) : this._scope.genesis;

            const data = {
                height: height,
            };

            let BlockClass;

            if ( height ) {

                data.prevHash =  prevBlock.hash();
                data.target = await chainData.nextTarget( prevBlock.height );
                data.timestamp = await chainData.getBlockTimestamp(height -1 ) + 1;
                data.prevKernelHash = prevBlock.kernelHash();

                BlockClass = Block;

            } else { //Genesis

                data.prevHash =  prevBlock.prevHash;
                data.target = prevBlock.target;
                data.prevKernelHash = prevBlock.prevKernelHash;
                data.timestamp = prevBlock.timestamp;

                BlockClass = this._scope.genesis.constructor;

            }

            block = new BlockClass( {
                ...this._scope,
                chain: this,
            }, undefined, data , "object", {skipProcessingConstructionValues: true}  );

            block.height = height;

            const prevTotalDifficulty = block.height ? await chainData.getBlockTotalDifficulty( block.height -1 ) : new BN(0);
            block.totalDifficulty = prevTotalDifficulty.add( block.difficulty );


        }catch(err){
            this._scope.logger.error(this, "createBlock raised an error", err);
        }

        return block;
    }

    async validateChain(){

        for (let i=this.data.start; i < this.data.end; i++){

            const block = await this.getBlock(i);
            if ( await block.validateBlock(this) !== true )
                return false;

        }

        return true;
    }


    async filterIdenticalBlocks(blocks){

        //Identify which blocks are matching so we can skip them right now.
        let index = 0;
        while (index < blocks.length && blocks[index].height < this.data.end ){
            const hash = await this.data.getBlockHash( blocks[index].height );
            if (hash.equals( blocks[index].hash() ))
                index++;
            else
                break;
        }

        if (index > 0)
            blocks = blocks.splice(index);

        return blocks;
    }

    get _chainDataClass(){
        return BaseChainData;
    }

    get isForkSubChain(){
        return false;
    }


}