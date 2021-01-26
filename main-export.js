if (typeof window !== "undefined" && typeof global.BROWSER === "undefined")
    global.BROWSER = true;

const library = require( (typeof BROWSER !== "undefined" && BROWSER) ? './build-browser' : './build-node' );

module.exports = library;