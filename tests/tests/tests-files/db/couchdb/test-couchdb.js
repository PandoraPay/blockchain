import TestBlock from "../tests/block/test-block";
import TestChainCluster from "../tests/chain/test-chain-cluster";
import TestChain from "../tests/chain/test-chain";

const  {Helper} = global.protocol.helpers;
const {describe} = global.protocol.tests;
const {DBConstructor} = global.protocol.marshal.db;
const cluster = require('cluster');


/**
 *
 * UNIT TESTING FOR COUCH DB
 *
 */

export default async function run() {

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
    await TestChainCluster("CouchDB");
    await TestChain("CouchDB");
    await TestTransactionsChain("CouchDB");
    await TestTransactionsChainCluster("CouchDB");

}
