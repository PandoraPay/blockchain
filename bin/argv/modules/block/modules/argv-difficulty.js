const {BN} = global.kernel.utils;

export default {

    blockTime: 60, //in seconds

    maxTargetBigNumber: new BN("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16),
    maxTargetBuffer: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),

    blockWindow: 10,

}

