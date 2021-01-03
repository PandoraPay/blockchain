import TestBlock from "../tests/block/test-block";
import TestChainCluster from "../tests/chain/test-chain-cluster";
import TestChain from "../tests/chain/test-chain";
import TestTransactionsChain from "../tests/transactions/stake/test-transactions-chain"
import TestTransactionsChainCluster from "../tests/transactions/stake/test-transactions-chain-cluster"
import TestTransaction from "../tests/transactions/test-transaction"

const  {Helper} = global.kernel.helpers;
const {describe} = global.kernel.tests;
const {DBConstructor} = global.kernel.marshal.db;
const cluster = require('cluster');

/**
 *
 * UNIT TESTING FOR POUCH DB
 *
 */

export default async function run() {

    describe("PouchDB Chain Test", {

        'PouchDB Chain Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db: {
                            ...this._scope.argv.dbPublic,
                            selectedDB: "pouch",
                            pouchDB:{
                                ...this._scope.argv.dbPublic.pouchDB,
                                path: this._scope.argv.dbPublic.pouchDB.path+"_test" + (cluster.worker ? process.env.SLAVE_INDEX : 'master'), //necessary to include
                            }
                        }
                    }
                }, true )
            );

            await this.db.connectDB();

            await this.db.client.destroy();

        },

    });


    await TestBlock("PouchDB");
    await TestChain("PouchDB");
    await TestChainCluster("PouchDB");
    await TestTransaction("PouchDB");
    await TestTransactionsChain("PouchDB");
    await TestTransactionsChainCluster("PouchDB");

}
