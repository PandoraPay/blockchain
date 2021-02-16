const  {Helper} = PandoraLibrary.helpers;
const {describe} = PandoraLibrary.tests;

const {asyncTimeout} = PandoraLibrary.helpers.AsyncInterval;

module.exports = function run (dbType) {

    async function _createBlocks(count){

        const masterCluster = await  this._scope.app.createMasterCluster(   undefined, {
            argv: {
                masterCluster:{
                    workerEnv:{
                        testDescribe1: `${dbType} Chain Test`,
                        testName1: `${dbType} Chain Connect`,
                    }
                }
            },
            db: this.db,
        });

        await masterCluster.start();

        const chain = this._scope.mainChain;

        if (masterCluster.isMaster){

            await Helper.waitUntilCondition( () => masterCluster.totalPeers.count === 2 * this._scope.argv.masterCluster.workerCount, undefined, 55000 );

            const subChain = chain.createSubChain();

            for (let i=0; i < count; i++){
                
                const blocks = await this._scope.blockchain.testsBlockHelper.createTestBlocks( subChain, 10);
                const result = await chain.addBlocks( blocks );

                this.expect(result, true);
                this.expect(chain.data.end, (i+1) * 10);

                const processes = {}, processList = [];
                await Helper.promiseTimeout( new Promise( resolve => {
                    masterCluster.on("blocks-received", data=>{
                        if (!processes[data.slaveIndex]){
                            processes[data.slaveIndex] = true;
                            processList.push(data.slaveIndex);
                        }
                        if (processList.length === this._scope.argv.masterCluster.workerCount )
                            resolve(true);
                    });
                }), 55000 );

            }


            masterCluster.sendMessage("blocks-received-confirmed", {result: true}, true);

            await Helper.waitUntilCondition( () => masterCluster.stickyMaster.workers.length === 0, undefined, 55000 );

            await masterCluster.close();


        } else {


            for (let i=0; i < count; i++) {
                await Helper.waitUntilCondition(() => chain.data.end === (i + 1) * 10, undefined, 55000);
                masterCluster.sendMessage( "blocks-received", { slaveIndex: process.env.SLAVE_INDEX } );
            }

            await Helper.promiseTimeout( new Promise( resolve => {
                masterCluster.on("blocks-received-confirmed", data=>{
                    resolve(true);
                });
            }), 55000);

            process.exit(1);


        }
    }

    describe( `${dbType} MainChain Creation with Cluster`, {


        'chain initialization clear': async function () {

            const masterCluster = await  this._scope.app.createMasterCluster(   undefined, {
                argv: {
                    masterCluster:{
                        workerEnv:{
                            testDescribe1: `${dbType} Chain Test`,
                            testName1: `${dbType} Chain Connect`,
                        }
                    },
                },
                db: this.db,
            });

            await masterCluster.start();

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );
            await chain.clearChain();

            if (masterCluster.isMaster){

            }

            await masterCluster.close();
        },

        'chain initialization - masterCluster 10 blocks': async function () {

            await _createBlocks.call(this, 1);

        },

        'chain initialization clear 2': async function () {

            const chain = await this._scope.app.createMainChain( undefined, {
                db: this.db,
            } );
            await chain.clearChain();
        },

        'chain initialization - masterCluster 30 blocks': async function () {

            await _createBlocks.call(this, 3);


        },

    });

}