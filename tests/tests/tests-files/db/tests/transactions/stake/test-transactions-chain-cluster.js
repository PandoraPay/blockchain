const  {Helper} = global.kernel.helpers;
const {describe} = global.kernel.tests;

export default function run () {

    describe("Tests Staking Transactions Chain CLUSTER", {

        'chain initialization': async function () {

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );
            this._scope.app.setScope( undefined, "masterCluster", { isMaster: true, on: ()=>{}, once: ()=>{}, broadcastMessage: ()=>{}, sendMessage: ()=>{}, broadcastToSocketsAsync: ()=>{} }, undefined, [ this.db ] );

            await chain.clearChain();

        },

        'chain create 10 blocks - Chain CLUSTER': async function () {

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );
            this._scope.app.setScope( undefined, "masterCluster", { isMaster: true, on: ()=>{}, once: ()=>{}, broadcastMessage: ()=>{}, sendMessage: ()=>{}, broadcastToSocketsAsync: ()=>{} }, undefined, [ this.db ] );

            await chain.clearChain();

            this.expect(chain.data.end, 0);

            const subChain = chain.createSubChain();

            const blocks = await this._scope.blockchain.testsBlockHelper.createTestBlocks( subChain, 10, 0);

            const result = await chain.addBlocks( blocks );

            this.expect(result, true);
            this.expect(chain.data.end, 10);

        },




    });

}