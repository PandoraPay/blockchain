const {describeList} = require('kernel').tests;

const ArgvTest = require("./argv/argv-test")

const TestsWallet = require( "./tests-files/wallet/tests-wallet")
const TestRedis = require( "./tests-files/db/redis/test-redis")
const TestPouchDB = require( "./tests-files/db/pouchdb/test-pouchdb")
const TestCouchDB = require( "./tests-files/db/couchdb/test-couchdb")
const TestsBlockHelper = require( "./tests-files/tests-block-helper")

module.exports = {

    argvTests: ArgvTest,
    tests: async scope => {

        scope.logger.info(`Tests`, `Running Blockchain tests`);

        scope.blockchain.testsBlockHelper = new TestsBlockHelper( scope );

        await TestsWallet(scope);

        //await TestRedis();

        // await TestCouchDB();

        await TestPouchDB();


    }

}
