const {DBSchemaBuild} = PandoraLibrary.db;
const {Helper} = PandoraLibrary.helpers;
const {MarshalData} = PandoraLibrary.marshal;

class BaseChainDataSchemaBuild extends DBSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields:{

                table: {
                    default: "basechain",
                    minSize: 9,
                    maxSize: 9,
                },

                version: {
                    type: "number",
                    default: 0,

                    position: 100,
                },

                /**
                 * Starting Height
                 */
                start: {
                    type: "number",
                    default: 0,

                    position: 101,
                },

                /**
                 * Length of Blockchain
                 */
                end: {
                    type: "number",
                    default: 0,

                    position: 102,
                },

                /**
                 * Number of transactions
                 */
                transactionsIndex:{
                    type: "number",
                    default:0,

                    position: 103,
                },

                /**
                 * Number of Tokens
                 */
                tokensIndex:{
                    type: "number",
                    default: 0,

                    position: 104,
                },

                circulatingSupply: {
                    type: "number",
                    default: 0,

                    position: 105,
                },

                /**
                 * Total Work (sum of difficulties)
                 */
                chainwork:{

                    type: "bigNumber",

                    // minsize: 0,
                    // maxsize: 2^256,

                    preprocessor(chainwork){
                        this.chainworkBuffer = MarshalData.compressBigNumber(chainwork);
                        return chainwork;
                    },

                    position: 106,
                },


                /**
                 * Hash of the entire chain
                 */
                hash:{

                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    position: 107,
                },

                /**
                 * PrevHash of the entire chain
                 */
                prevHash:{

                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    position: 108,
                },

                /**
                 * KernelHash of the last block
                 */
                kernelHash:{

                    type: "buffer",
                    maxSize: 32,
                    minSize: 32,

                    removeLeadingZeros: true,

                    position: 109,
                },

                /**
                 * PrevKernelHash of the last block
                 */
                prevKernelHash:{

                    type: "buffer",
                    minSize: 32,
                    maxSize: 32,

                    removeLeadingZeros: true,

                    position: 110,
                },

            }

        },schema, true) );

    }


}

module.exports = {
    BaseChainDataSchemaBuild,
    BaseChainDataSchemaBuilt: new BaseChainDataSchemaBuild()
}