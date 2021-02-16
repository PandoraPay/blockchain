const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {Helper, Exception} = PandoraLibrary.helpers;

const {TxRevertInfoHashMapElementSchemaBuilt} = require( "./tx-revert-info-hash-map-element-schema-build")

/**
 * Required for consensus. Used only for explorer
 * Stores json info related to revert a Transaction
 *
 */

module.exports = class TxRevertInfoHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = TxRevertInfoHashMapElementSchemaBuilt;
    }

}