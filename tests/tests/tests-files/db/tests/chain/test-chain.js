const  {Helper} = PandoraLibrary.helpers;
const {describe} = PandoraLibrary.tests;

const hashes = {}, kernelHashes = {};

module.exports = function run () {

    describe("Simple MainChain Creation", {

        'chain initialization': async function () {

            this._scope.app.setScope( undefined, "masterCluster", { isMaster: true, on: ()=>{}, once: ()=>{}, broadcastMessage: ()=>{}, sendMessage: ()=>{}, broadcastToSocketsAsync: ()=>{} }, undefined, [ this.db ] );

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );

            await chain.clearChain();

            this.expect(typeof chain, "object" );

        },

        'chain initialization with first 10 blocks': async function () {

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );

            await chain.clearChain();

            this.expect(chain.data.end, 0);

            const subChain = chain.createSubChain();

            const blocks = await this._scope.blockchain.testsBlockHelper.createTestBlocks( subChain, 10,);

            for (let i=0; i < blocks.length; i++){
                hashes[i] = blocks[i].hash();
                kernelHashes[i] = blocks[i].kernelHash();
            }

            const result = await chain.addBlocks( blocks );

            this.expect(result, true);
            this.expect(chain.data.end, 10);

            for (let i=0; i < chain.data.end; i++){
                const block = await chain.data.getBlockByHeight(i);
                this.expect(hashes[i], block.hash() );
                this.expect(kernelHashes[i], block.kernelHash() );
            }

            //validate blocks marshals

            for (let i=0; i < blocks.length; i++){

                const newBlock = await chain.createBlock(i);
                newBlock.height = i;

                const oldBlock = blocks[i];
                const json = oldBlock.toJSON();

                newBlock.fromJSON(json);

                this.expect( oldBlock.totalDifficulty.toString(), newBlock.totalDifficulty.toString() );
                this.expect( oldBlock.hash(), newBlock.hash() );
                this.expect( oldBlock.kernelHash(), newBlock.kernelHash() );

            }

            for (let i=0; i < blocks.length; i++){

                const newBlock = await chain.createBlock(i);
                newBlock.height = i;

                const oldBlock = blocks[i];
                const buffer = oldBlock.toBuffer();

                this.expect(buffer.length > 10, true);

                newBlock.fromBuffer(buffer);

                this.expect( oldBlock.totalDifficulty.toString(), newBlock.totalDifficulty.toString() );
                this.expect( oldBlock.hash(), newBlock.hash() );
                this.expect( oldBlock.kernelHash(), newBlock.kernelHash() );

            }

            console.log("IT WORKED");

        },

        'chain initialization next 10 blocks': async function () {


            const subChain = this._scope.mainChain.createSubChain();

            const blocks = await this._scope.blockchain.testsBlockHelper.createTestBlocks( subChain, 10);

            for (let i=0; i < blocks.length; i++){
                hashes[blocks[i].height] = blocks[i].hash();
                kernelHashes[blocks[i].height] = blocks[i].kernelHash();
            }

            const result = await this._scope.mainChain.addBlocks( blocks );

            this.expect(result, true);
            this.expect(this._scope.mainChain.data.end, 20);

            for (let i=0; i < this._scope.mainChain.data.end; i++){
                const block = await this._scope.mainChain.data.getBlockByHeight(i);
                this.expect(hashes[i], block.hash() );
                this.expect(kernelHashes[i], block.kernelHash() );
            }

        },

        'chain initialization next 50 blocks': async function () {


            const subChain = this._scope.mainChain.createSubChain();

            const blocks = await this._scope.blockchain.testsBlockHelper.createTestBlocks( subChain, 50);

            const result = await this._scope.mainChain.addBlocks( blocks );

            this.expect(result, true);
            this.expect(this._scope.mainChain.data.end, 70);

        },



    });

}