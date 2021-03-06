const  {Helper} = PandoraLibrary.helpers;
const {describe} = PandoraLibrary.tests;

module.exports = function run () {

    describe("Tests Stake Transactions", {

        'chain initialization': async function () {

            this._scope.app.setScope( undefined, "masterCluster", { isMaster: true, on: ()=>{}, once: ()=>{}, broadcastMessage: ()=>{}, sendMessage: ()=>{}, broadcastToSocketsAsync: ()=>{} }, undefined, [ this.db ] );

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );

            await chain.clearChain();

        },

        'simple transaction creator': async function (){

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );

            await chain.clearChain();

            const subChain = chain.createSubChain();

            const blocks = await this._scope.blockchain.testsBlockHelper.createTestBlocks( subChain, 10,);

            const result = await chain.addBlocks( blocks );

            this.expect(result, true);
            this.expect(chain.data.end, 10);

            const wallet = this._scope.wallet.addresses[0];

            const out1 = this._scope.cryptography.addressGenerator.generatePrivateKeyFromMnemonic( ).privateKeyModel;
            const out2 = this._scope.cryptography.addressGenerator.generatePrivateKeyFromMnemonic( ).privateKeyModel;

            const outTx = await chain.transactionsCreator.createSimpleTransaction( {
                vin: [{
                    publicKey: await wallet.keys.decryptPublicKey(),
                    amount: 1000,
                }],
                vout: [{
                    publicKeyHash: out1.getAddress().publicKeyHash,
                    amount: 333,
                }, {
                    publicKeyHash: out2.getAddress().publicKeyHash,
                    amount: 666
                }],
                privateKeys: [ {
                    privateKey: wallet.keys.decryptPrivateKey()
                } ]
            } );

            this.expect( !!outTx, true );
            this.expect( !!outTx.tx, true );
            this.expect( outTx.signatures[0].length, 65 );

            const newTx = await this._scope.memPool.newTransaction(outTx.tx.hash(), outTx.tx);
            this.expect(!!newTx, true);

            const outTx2 = await chain.transactionsCreator.createSimpleTransaction( {
                vin: [{
                    publicKey: await wallet.keys.decryptPublicKey(),
                    amount: 1000,
                }],
                vout: [{
                    publicKeyHash: out1.getAddress().publicKeyHash,
                    amount: 334,
                }, {
                    publicKeyHash: out2.getAddress().publicKeyHash,
                    amount: 666
                }],
                privateKeys: [ {
                    privateKey: wallet.keys.decryptPrivateKey()
                } ],
            } );

            this.expect( outTx.tx.hash().toString("hex") === outTx2.tx.hash().toString("hex"), false);

            const newTx2 = await this._scope.memPool.newTransaction(outTx2.tx.hash(), outTx2.tx);
            this.expect(!!newTx2, true);

            //let's mine the transaction

            const blockWithTx = await this._scope.blockchain.testsBlockHelper.createTestBlocks( subChain, 1 );

            this.expect(blockWithTx[0].transactionsMerkleTree.count, 2);
            this.expect(blockWithTx[0].transactionsMerkleTree.leaves()[0].data, outTx.tx.toBuffer() );
            this.expect(blockWithTx[0].transactionsMerkleTree.leaves()[1].data, outTx2.tx.toBuffer() );

            const result2 = await chain.addBlocks( blockWithTx );

            this.expect(result2, true);

            const nonce = await chain.data.accountHashMap.getNonce( outTx.tx.vin[0].publicKeyHash );
            this.expect(nonce, 2);

            const balance1 = await chain.data.accountHashMap.getBalance( outTx.tx.vout[0].publicKeyHash );
            const balance2 = await chain.data.accountHashMap.getBalance( outTx.tx.vout[1].publicKeyHash );
            this.expect(balance1, 334+333);
            this.expect(balance2, 666+666);

        },

    });

}