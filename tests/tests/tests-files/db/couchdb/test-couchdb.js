const TestBlock = require("../tests/block/test-block");
const TestChainCluster = require("../tests/chain/test-chain-cluster");
const TestChain = require("../tests/chain/test-chain");
const TestTransactionsChain = require("../tests/transactions/stake/test-transactions-chain")
const TestTransactionsChainCluster = require("../tests/transactions/stake/test-transactions-chain-cluster")
const TestTransaction = require("../tests/transactions/test-transaction")

const  {Helper} = PandoraLibrary.helpers;
const {describe} = PandoraLibrary.tests;
const {DBConstructor} = PandoraLibrary.db;
const {cluster} = PandoraLibrary.masterCluster;

/**
 *
 * UNIT TESTING FOR COUCH DB
 *
 */

module.exports = async function run() {

    describe("CouchDB Chain Test", {

        'CouchDB Chain Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db: {
                            ...this._scope.argv.dbPublic,
                            selectedDB: "couch",
                            couchDB:{
                                ...this._scope.argv.dbPublic.couchDB,
                                db: this._scope.argv.dbPublic.couchDB.db+"_test",
                            }
                        }
                    }
                }, true )
            );

            await this.db.connectDB();

            if (!cluster.worker)
                await this.db.client.destroy();

        },

    });

    await TestBlock("CouchDB");
    await TestChain("CouchDB");

    await TestChainCluster("CouchDB");

    await TestTransaction("CouchDB");
    await TestTransactionsChain("CouchDB");
    await TestTransactionsChainCluster("CouchDB");

}
