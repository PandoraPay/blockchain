/**
 * Load Library and run it
 */

if ( typeof BROWSER !== "undefined" )
    global.BROWSER = true;

const library  = require("./build/output/build-browser");

library.app.start();

module.exports = library;