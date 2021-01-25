const  {Helper} = require('kernel').helpers;
const {describe} = require('kernel').tests;
const {DBConstructor} = require('kernel').marshal.db;
const {cluster} = require('kernel').masterCluster;

const TestBlock = require("../tests/block/test-block");
const TestChainCluster = require( "../tests/chain/test-chain-cluster");
const TestChain = require("../tests/chain/test-chain");
const TestTransactionsChain = require( "../tests/transactions/stake/test-transactions-chain")
const TestTransactionsChainCluster = require( "../tests/transactions/stake/test-transactions-chain-cluster")
const TestTransaction = require("../tests/transactions/test-transaction")

/**
 *
 * UNIT TESTING FOR REDIS
 *
 */

module.exports = async function run () {


    describe("Redis Chain Test", {

        'Redis Chain Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db:{
                            ...this._scope.argv.dbPublic,
                            selectedDB: "redis",
                            redisDB:{
                                ...this._scope.argv.dbPublic.redisDB,
                                db: this._scope.argv.dbPublic.redisDB.db,
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

    await TestBlock("Redis");
    await TestChain("Redis");

    // await TestChainCluster("Redis");

    await TestTransaction("Redis");
    // await TestTransactionsChain("Redis");
    // await TestTransactionsChainCluster("Redis");


}
