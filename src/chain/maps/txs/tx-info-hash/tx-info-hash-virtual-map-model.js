const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {Helper, Exception} = PandoraLibrary.helpers;

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: Block Height, Block Timestamp, Merkle Tree Leaf Height and Merkle Tree Height
 *
 */

const {TxInfoHashMapElementSchemaBuilt} = require('./tx-info-hash-map-element-schema-build')

module.exports = class TxInfoHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = TxInfoHashMapElementSchemaBuilt;
    }

}