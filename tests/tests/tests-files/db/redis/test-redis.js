import TestBlock from "../tests/block/test-block";
import TestChainCluster from "../tests/chain/test-chain-cluster";
import TestChain from "../tests/chain/test-chain";
import TestTransactionsChain from "../tests/transactions/stake/test-transactions-chain"
import TestTransactionsChainCluster from "../tests/transactions/stake/test-transactions-chain-cluster"
import TestTransaction from "../tests/transactions/test-transaction"


const  {Helper} = global.protocol.helpers;
const {describe} = global.protocol.tests;
const {DBConstructor} = global.protocol.marshal.db;
const cluster = require('cluster');

/**
 *
 * UNIT TESTING FOR REDIS
 *
 */

export default async function run () {


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
