const {describe} = require('kernel').tests;

const Block = require( "../../../../../../src/block/block")
const BlockVersionEnum = require("../../../../../../src/block/block-version-enum")

async function validateBlockZero( block ){

    this.expect(block.height, 0);
    this.expect(block.version, BlockVersionEnum.DEFAULT_BLOCK );

    this.expect( block.hash().equals( Buffer.alloc(32) ), false);

    let json = block.toJSON(true);

    const newBlock = new Block(this._scope, {

        fields: {
            prevHash: {
                default: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex")
            },
            target: {
                default: Buffer.from("000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
            },
        },

    });

    newBlock.fromJSON(json);

    this.expect( block.hash().equals( newBlock.hash() ), true);
    this.expect( block.kernelHash().equals( newBlock.kernelHash() ), true);

}

module.exports = function run (dbType) {

    describe( ()=> `${dbType} Simple Block Creation`, {

        'block initialization': async function () {

            const block = new Block(this._scope, {

                fields: {
                    prevHash: {
                        default: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex")
                    },
                    target: {
                        default: Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"),
                    },
                },

            }, {
                pos:{
                    stakingAmount: 10000,
                },
            });

            await validateBlockZero.call( this, block );

        },


    });

}