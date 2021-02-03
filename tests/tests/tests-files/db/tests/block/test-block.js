const {describe} = require('kernel').tests;

const BlockModel = require( "../../../../../../src/block/block-model")
const {BlockSchemaBuild} = require( "../../../../../../src/block/block-schema-build")
const BlockVersionEnum = require("../../../../../../src/block/block-version-enum")

async function validateBlockZero( block ){

    this.expect(block.height, 0);
    this.expect(block.version, BlockVersionEnum.DEFAULT_BLOCK );

    this.expect( block.hash().equals( Buffer.alloc(32) ), false);

    const json = block.toJSON(true);

    const BlockNewSchemaBuilt = new BlockSchemaBuild({

        fields: {
            prevHash: {
                default: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex")
            },
            target: {
                default: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
            },
        },

    });

    const newBlock = new BlockModel(this._scope, BlockNewSchemaBuilt );

    newBlock.fromJSON(json);

    this.expect( block.hash().equals( newBlock.hash() ), true);
    this.expect( block.kernelHash().equals( newBlock.kernelHash() ), true);

}

module.exports = function run (dbType) {

    describe( ()=> `${dbType} Simple Block Creation`, {

        'block initialization': async function () {

            const BlockNewSchemaBuilt = new BlockSchemaBuild({

                fields: {
                    prevHash: {
                        default: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex")
                    },
                    target: {
                        default: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
                    },
                },

            })

            const block = new BlockModel(this._scope, BlockNewSchemaBuilt , {
                pos:{
                    stakingAmount: 10000,
                },
            });

            await validateBlockZero.call( this, block );

        },


    });

}