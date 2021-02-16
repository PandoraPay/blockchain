const {MerkleTreeRootSchemaBuild} = PandoraLibrary.dataStructures.merkleTree.schema.MerkleTreeRootSchemaBuild;
const {MerkleTreeRoot} = PandoraLibrary.dataStructures.merkleTree;
const {Helper, Exception} = PandoraLibrary.helpers;

class TxMerkleTreeRootSchemaBuild extends MerkleTreeRootSchemaBuild {

    constructor(schema){

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
    TxMerkleTreeRootSchemaBuild,
    TxMerkleTreeRootSchemaBuilt: new TxMerkleTreeRootSchemaBuild()
}