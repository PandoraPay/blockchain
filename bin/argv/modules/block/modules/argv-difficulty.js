const {BN} = require('kernel').utils;

module.exports = {

    blockTime: 60, //in seconds

    maxTargetBigNumber: new BN("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16),
    maxTargetBuffer: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),

    blockWindow: 10,

}

