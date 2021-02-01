const {DBSchemaBuild} = require('kernel').db;
const {CryptoHelper} = require('kernel').helpers.crypto;
const BlockVersionEnum = require( "./block-version-enum")
const {BN} = require('kernel').utils;
const {Helper, EnumHelper, Exception} = require('kernel').helpers;

const TransactionsMerkleTreeDBModel = require( "./transactions/merkle-tree/transactions-merkle-tree-db-model");
const BlockPoSDBModel = require( "./pos/block-pos-db-model")

class BlockDBSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "block",
                    fixedBytes: 5,
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
                    fixedBytes(){
                        return this._scope.argv.block.hashSize;
                    },

                    position: 103,
                },

                /**
                 * prevKernelHash
                 */

                prevKernelHash: {

                    type: "buffer",
                    fixedBytes(){
                        return this._scope.argv.block.hashSize;
                    },

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
                    fixedBytes: 32,

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
                    modelClass: TransactionsMerkleTreeDBModel,

                    position: 108,
                },

                tokens: {
                    type: "number",

                    position: 109,
                },

                pos: {
                    type: "object",
                    modelClass: BlockPoSDBModel,

                    position: 200,
                },


            },

            options: {

                hashing: {
                    enabled: true,

                    fct: CryptoHelper.dkeccak256,

                },

            }

        },
        schema, true));

    }

}

module.exports = {
    BlockDBSchemaBuild,
    BlockDBSchemaBuilt: new BlockDBSchemaBuild(),
}