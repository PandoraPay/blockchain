const library = require( typeof BROWSER !== "undefined" ? './../build/output/build-browser' : './../build/output/build-node' );

module.exports = library;