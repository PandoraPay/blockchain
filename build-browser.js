if ( typeof BROWSER !== "undefined" )
    global.BROWSER = true;

const library = require("./index");

window.library = library;

module.exports = library;
