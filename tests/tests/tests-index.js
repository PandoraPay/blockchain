import ArgvTest from "./argv/argv-test"
const {describeList} = global.kernel.tests;

import TestsWallet from "./tests-files/wallet/tests-wallet"

import TestRedis from "./tests-files/db/redis/test-redis"
import TestPouchDB from "./tests-files/db/pouchdb/test-pouchdb"
import TestCouchDB from "./tests-files/db/couchdb/test-couchdb"

import TestsBlockHelper from "./tests-files/tests-block-helper"

export default {

    argvTests: ArgvTest,
    tests: async scope => {

        scope.logger.info(`Tests`, `Running Blockchain tests`);

        scope.blockchain.testsBlockHelper = new TestsBlockHelper( scope );

        await TestsWallet(scope);

        await TestRedis();

        // await TestCouchDB();
        // await TestPouchDB();


    }

}
