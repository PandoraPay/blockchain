/**
 * Load Library and run it
 */

const library  = require("./build/output/build-browser");

library.app.start();

module.exports = library;