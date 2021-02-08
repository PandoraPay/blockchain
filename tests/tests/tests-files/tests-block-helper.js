module.exports = class TestsBlockHelper {

    constructor(scope){
        this._scope = scope;
    }

    async waitForgingBlockWithWallet(block){

        this._scope.forging.reset = false;

        let out;
        while (!out){
            out = await block._scope.forging.forgeBlock.forgeBlockWithWallet(block );
        }

        return out;

    }

    async createTestBlocks(chain, count = 1 ){
        
        const array = [];

        for (let i=0; i < count; i++){

            this._scope.logger.log( this, "account tree", {chainLength: chain.data.end} );

            const block = await chain._scope.forging.forgeBlock.createBlockForging( chain );

            const out = await this.waitForgingBlockWithWallet(block);
            if (out) {
                await chain.addBlocks(block);
                array.push(block);
                this._scope.logger.log( this, "new block", {i , hash: block.hash().toString("hex"), kernelHash: block.kernelHash().toString("hex") } );
            }


        }

        return array;

    }


}