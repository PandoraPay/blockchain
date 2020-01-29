/**
 * Load Library and run it
 */


const library  = require("./build/output/build-node").default;

library.app.start();

module.exports = library;