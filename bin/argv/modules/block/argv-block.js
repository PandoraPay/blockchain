const ArgvDifficulty = require("./modules/argv-difficulty")
const ArgvTimestamp = require( "./modules/argv-timestamp")

module.exports = {

    hashSize: 32,
    sizeMax: 1e6, // 1 mb

    difficulty: ArgvDifficulty,
    timestamp: ArgvTimestamp,

}