const TestBlock = require("../tests/block/test-block");
const TestChainCluster = require( "../tests/chain/test-chain-cluster");
const TestChain = require( "../tests/chain/test-chain");
const TestTransactionsChain = require( "../tests/transactions/stake/test-transactions-chain")
const TestTransactionsChainCluster = require( "../tests/transactions/stake/test-transactions-chain-cluster")
const TestTransaction = require("../tests/transactions/test-transaction")

const  {Helper} = require('kernel').helpers;
const {describe} = require('kernel').tests;
const {DBConstructor} = require('kernel').marshal.db;
const {cluster} = require('kernel').masterCluster;

/**
 *
 * UNIT TESTING FOR POUCH DB
 *
 */

module.exports = async function run() {

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
