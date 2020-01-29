/**
 * Load Library and run it
 */

if (!global.protocol) require('protocol');
if (!global.cryptography) require('cryptography');
if (!global.networking) require('networking');


const library  = require("./build/output/build-node").default;

library.app.start();

module.exports = library;