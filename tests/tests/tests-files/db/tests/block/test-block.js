const {describe} = require('kernel').tests;

const BlockDBModel = require( "../../../../../../src/block/block-db-model")
const {BlockDBSchemaBuild} = require( "../../../../../../src/block/block-db-schema-build")
const BlockVersionEnum = require("../../../../../../src/block/block-version-enum")

async function validateBlockZero( block ){

    this.expect(block.height, 0);
    this.expect(block.version, BlockVersionEnum.DEFAULT_BLOCK );

    this.expect( block.hash().equals( Buffer.alloc(32) ), false);

    const json = block.toJSON(true);

    const BlockNewDBSchemaBuilt = new BlockDBSchemaBuild({

        fields: {
            prevHash: {
                default: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex")
            },
            target: {
                default: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
            },
        },

    });

    const newBlock = new BlockDBModel(this._scope, BlockNewDBSchemaBuilt );

    newBlock.fromJSON(json);

    this.expect( block.hash().equals( newBlock.hash() ), true);
    this.expect( block.kernelHash().equals( newBlock.kernelHash() ), true);

}

module.exports = function run (dbType) {

    describe( ()=> `${dbType} Simple Block Creation`, {

        'block initialization': async function () {

            const BlockNewDBSchemaBuilt = new BlockDBSchemaBuild({

                fields: {
                    prevHash: {
                        default: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex")
                    },
                    target: {
                        default: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
                    },
                },

            })

            const block = new BlockDBModel(this._scope, BlockNewDBSchemaBuilt , {
                pos:{
                    stakingAmount: 10000,
                },
            });

            await validateBlockZero.call( this, block );

        },


    });

}