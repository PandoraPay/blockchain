const {DBSchemaBuild} = require('kernel').db;
const {CryptoHelper} = require('kernel').helpers.crypto;
const BlockVersionEnum = require( "./block-version-enum")
const {BN} = require('kernel').utils;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;

const TxMerkleTreeModel = require( "./transactions/merkle-tree/tx-merkle-tree-model");
const BlockPoSModel = require( "./pos/block-pos-model")

class BlockSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "block",
                    minSize: 5,
                    maxSize: 5,
                },


                /**
                 * Height of the block
                 */
                height: {

                    type: "number",

                    position: 100,

                },

                /**
                 * Id is just the block height as it is unique
                 */
                id: {
                    default() {
                        return "b_" + this.height.toString();
                    },
                    maxSize: 12,
                    minSize: 3,

                    position: 101,
                },


                /**
                 * Block Version
                 */
                version: {

                    type: "number",

                    default() {
                        if (this.height >= 0) return BlockVersionEnum.DEFAULT_BLOCK;
                    },

                    validation(version) {
                        return EnumHelper.validateEnum(version, BlockVersionEnum);
                    },

                    position: 102,

                },

                /**
                 * Block Prev Hash. Usually it contains many leading zeros
                 */
                prevHash: {

                    type: "buffer",
                    maxSize: 32,
                    minSize: 32,

                    position: 103,
                },

                /**
                 * prevKernelHash
                 */

                prevKernelHash: {

                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    removeLeadingZeros: true,

                    position: 104,

                },


                /**
                 * Unix epoch time recorded for block
                 */
                timestamp: {

                    type: "number",

                    position: 105,

                },

                /**
                 * Block Target Threshold
                 */

                target: {

                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    removeLeadingZeros: true,

                    default() {
                        return this._scope.argv.block.difficulty.maxTargetBuffer;
                    },

                    preprocessor(target) {

                        const targetBigNumber = new BN(target.toString("hex"), 16);

                        if (targetBigNumber.eq(new BN(0)))
                            this.difficulty = new BN(0);
                        else
                            this.difficulty = this._scope.argv.block.difficulty.maxTargetBigNumber.div(targetBigNumber);

                        return target;

                    },

                    position: 106,

                },

                totalDifficulty: {

                    type: "bigNumber",

                    position: 107,
                },

                transactionsMerkleTree: {

                    type: "object",
                    modelClass: TxMerkleTreeModel,

                    position: 108,
                },

                newTokens: {
                    type: "number",
                    default: 0,

                    position: 109,
                },

                pos: {
                    type: "object",
                    modelClass: BlockPoSModel,

                    position: 200,
                },


            },

        },
        schema, true));

    }

}

module.exports = {
    BlockSchemaBuild,
    BlockSchemaBuilt: new BlockSchemaBuild(),
}