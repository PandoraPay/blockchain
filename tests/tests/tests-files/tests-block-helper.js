export default class TestsBlockHelper {

    constructor(scope){
        this._scope = scope;
    }

    async waitForgingBlockWithWallet(block, createTransactionsCallback){

        this._scope.forging._reset = false;

        let out;
        while (!out){
            out = await block._scope.forging.forgeBlock.forgeBlockWithWallet(block, createTransactionsCallback);
        }

        return out;

    }

    async createTestBlocks(chain, count = 1, createTransactionsCallback ){
        
        const array = [];

        for (let i=0; i < count; i++){

            console.log( "account tree", chain.data.end );

            const block = await chain._scope.forging.forgeBlock.createBlockForging( chain );

            const out = await this.waitForgingBlockWithWallet(block, createTransactionsCallback);

            await chain.addBlocks( block );
            array.push(block);

            console.log( "new block", i , block.hash().toString("hex"), block.kernelHash().toString("hex"));

        }

        return array;

    }


}