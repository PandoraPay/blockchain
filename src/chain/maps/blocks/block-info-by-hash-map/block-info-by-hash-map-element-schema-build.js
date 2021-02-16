const {BlockByHashMapElementSchemaBuild} = require('../../blocks/block-by-hash-map/block-by-hash-map-element-schema-build')
const {Helper, Exception} = PandoraLibrary.helpers;

class BlockInfoByHashMapElementSchemaBuild extends BlockByHashMapElementSchemaBuild{

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "blkInfoByHashMap",
                    minSize: 16,
                    maxSize: 16,
                },

                version: {
                    default: 0,
                    validation(value) {
                        return value === 0;
                    },
                },

                data: null,

                blockHash: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,
                    position: 20000,
                },

                kernelHash: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,
                    // removeLeadingZeros: true,
                    position: 20001,
                },

                //hash
                prevHash: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,
                    position: 20002,
                },

                prevKernelHash: {
                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,
                    // removeLeadingZeros: true,
                    position: 20003,
                },

                size: {
                    type: "number",
                    position: 20004,
                },

                txs: {
                    type: "number",
                    position: 20005,
                },

                timestamp:{
                    type: "number",
                    position: 20006,
                },

                stakeForgerPublicKey: {
                    type: "buffer",
                    maxSize: 33,
                    minSize: 33,

                    position: 20007,
                },

                totalDifficulty: {

                    type: "bigNumber",

                    position: 20008,
                },

            },

        }, schema, true));

    }

}

module.exports = {
    BlockInfoByHashMapElementSchemaBuild,
    BlockInfoByHashMapElementSchemaBuilt: new BlockInfoByHashMapElementSchemaBuild()
}