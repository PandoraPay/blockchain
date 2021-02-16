const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {Helper, Exception} = PandoraLibrary.helpers;

const {AddressHashMapElementSchemaBuilt} = require( "./address-hash-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: TransactionsCount associated with an address
 *
 */

module.exports = class AddressHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema , data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = AddressHashMapElementSchemaBuilt;
    }

}