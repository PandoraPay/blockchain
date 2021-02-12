const BaseChain = require( "../base/base-chain")
const SubChainData = require("./data/sub-chain-data-model");

module.exports = class SubChain extends BaseChain{

    async clearChain(free = true){

        try{

            if (free)

                await Promise.all( this.data.listBlocks.map( async block => {

                    if (await block.exists() === false )
                        await block.delete();

                } ));

        } catch (err){

            this._scope.logger.error(this, "Error deleting clearning block", {key: key} );

        }

        try{

            await this.data.spliceBlocks( this, this.data.start, )

        }catch(err){

        }

        super.clearChain(this);

    }

    async addBlocks(blocks){

        if (!blocks) return false;
        if (!Array.isArray(blocks)) blocks = [blocks];
        if (blocks.length === 0) return false;

        blocks = await this.filterIdenticalBlocks(blocks);

        if (blocks.length === 0) return false;

        await this.data.spliceBlocks( this, blocks[0].height, );

        for (let i=0; i < blocks.length; i++){

            const block = blocks[i];

            if ( await block.validateBlock(this) !== true ) throw new Exception(this, "Block is invalid", block.height );

            this.insertBlock(block);

            if (this.data.start > block.height)
                this.data.start = block.height;

            if (this.data.end === block.height )
                this.data.end = block.height+1;

            const out = await block.addBlock(this, this.data);
            
            if (!out)
                return false;

        }

        return true;
    }

    insertBlock(block){

        if (this.data.blocks[block.height])
            throw new Exception(this, 'block already found', block.height );

        if (!this.data.blocks[block.height]) {
            let insertPosition;
            for (let j = 0; j < this.data.listBlocks.length - 1; j++)
                if (this.data.listBlocks[j].height < block.height && (j + 1 < this.data.listBlocks.length && this.data.listBlocks[j + 1].height > block.height)) {
                    insertPosition = j;
                    break;
                }
            this.data.pushArray( "listBlocks", block, "object", undefined, insertPosition );
            this.data.pushArray( "listHashes", block.hash(), "object", undefined, insertPosition );
            this.data.pushArray( "listKernelHashes", block.kernelHash(), "object", undefined, insertPosition );
        }
        this.data.blocks[block.height] = block;
        this.data.hashes[block.hash().toString('hex')] = block;
        this.data.kernelHashes[block.kernelHash().toString('hex')] = block;

    }

    async validateChain(){

        for (let block of this.data.listBlocks)
            if ( await block.validateBlock(this) !== true )
                return false;

        return true;
    }

    async saveChain(){

        return this._scope.app.mainChain.addBlocks( this.data.blocks );

    }

    get _chainDataClassModel(){
        return SubChainData;
    }

}