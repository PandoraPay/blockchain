const {MerkleTreeNodeSchemaBuild} = PandoraLibrary.dataStructures.merkleTree.schema.MerkleTreeNodeSchemaBuild;
const {Helper, Exception} = PandoraLibrary.helpers;
const {CryptoHelper} = PandoraLibrary.helpers.crypto;

class TxMerkleTreeNodeSchemaBuild extends MerkleTreeNodeSchemaBuild {

    constructor(schema) {

        super(Helper.merge({

            fields: {

                table: {
                    default: "TxMerkleNode",
                    minSize: 12,
                    maxSize: 12,
                },

            },

        }, schema, true) );

    }


}

module.exports = {
    TxMerkleTreeNodeSchemaBuild,
    TxMerkleTreeNodeSchemaBuilt: new TxMerkleTreeNodeSchemaBuild()
}