const BaseChain = require( "../base/base-chain")
const SubChainData = require("./data/sub-chain-data-model");
const {Helper, Exception} = PandoraLibrary.helpers;

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

        if ( !blocks.length ) return false;

        await this.data.spliceBlocks( this, blocks[0].height, );

        for (let i=0; i < blocks.length; i++){

            const block = blocks[i];

            if ( await block.validateBlock(this) !== true ) throw new Exception(this, "Block is invalid", block.height );

            await this.insertBlock(block);

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

        if (this.data.blocksMapByHeight[block.height])
            throw new Exception(this, 'block already found', block.height );

        this.data.pushArray( "listBlocks", block, "object" );

        let found;
        for (let i=0; i < this.data.listHashes.length; i++)
            if (this.data.listHashes[i].buffer.equals( block.hash() )) {
                found = true;
                break;
            }

        if (!found)
            this.data.pushArray( "listHashes", block.hash(), "object");

        return this.data.importBlock(block);

    }

    async validateChain(){

        for (let block of this.data.listBlocks)
            if ( await block.validateBlock(this) !== true )
                return false;

        return true;
    }

    async saveChain(){

        return this._scope.app.mainChain.addBlocks( this.data.listBlocks );

    }

    get _chainDataClassModel(){
        return SubChainData;
    }

}