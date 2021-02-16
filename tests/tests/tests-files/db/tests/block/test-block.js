const {describe} = PandoraLibrary.tests;

const BlockModel = require( "../../../../../../src/block/block-model")
const {BlockSchemaBuilt, BlockSchemaBuild} = require( "../../../../../../src/block/block-schema-build")
const BlockVersionEnum = require("../../../../../../src/block/block-version-enum")


async function validateBlockZero( block ){

    this.expect(block.height, 0);
    this.expect(block.version, BlockVersionEnum.DEFAULT_BLOCK );

    this.expect( block.hash().equals( Buffer.alloc(32) ), false);

    const json = block.toJSON(true);
    const buffer = block.toBuffer();


    const newBlock = new BlockModel(this._scope, BlockSchemaBuilt );

    newBlock.fromJSON(json);

    this.expect( block.hash().equals( newBlock.hash() ), true);
    this.expect( block.kernelHash().equals( newBlock.kernelHash() ), true);

    const newBlock2 = new BlockModel(this._scope, BlockSchemaBuilt);
    newBlock2.fromBuffer( buffer );

    this.expect( block.hash().equals( newBlock2.hash() ), true);
    this.expect( block.kernelHash().equals( newBlock2.kernelHash() ), true);

}

module.exports = function run (dbType) {

    describe( ()=> `${dbType} Simple Block Creation`, {

        'block initialization': async function () {

            const block = new BlockModel(this._scope, BlockSchemaBuilt, {
                prevHash: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
                target: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
                pos:{
                    stakingAmount: 10000,
                }
            } );

            await validateBlockZero.call( this, block );

        },

        'block empty initialization': async function () {

            const block = new BlockModel(this._scope, BlockSchemaBuilt, {
                prevHash: Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"),
                target: Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"),
                pos:{
                    stakingAmount: 1,
                }
            } );

            await validateBlockZero.call( this, block );

        },


    });

}