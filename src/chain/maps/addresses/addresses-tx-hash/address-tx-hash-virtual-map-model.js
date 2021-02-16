const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {Helper, Exception} = PandoraLibrary.helpers;

const {AddressTxHashMapElementSchemaBuilt} = require( "./address-tx-hash-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 */

module.exports = class AddressTxHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema , data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = AddressTxHashMapElementSchemaBuilt;
    }

}