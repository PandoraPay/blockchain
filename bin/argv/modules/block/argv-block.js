import ArgvDifficulty from "./modules/argv-difficulty"
import ArgvTimestamp from "./modules/argv-timestamp"

export default {

    hashSize: 32,
    sizeMax: 1e6, // 1 mb

    difficulty: ArgvDifficulty,
    timestamp: ArgvTimestamp,

}