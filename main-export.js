const library = require( (typeof BROWSER !== "undefined" && BROWSER) ? './build-browser' : './build-node' );

module.exports = library;