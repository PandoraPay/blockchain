/**
 * Load Library and run it
 */

const library  = require("./build/output/build-browser").default;

library.app.start();

module.exports = library;