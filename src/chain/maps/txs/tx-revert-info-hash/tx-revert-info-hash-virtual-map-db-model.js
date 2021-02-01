const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

const {TxRevertInfoHashMapElementDBSchemaBuilt} = require( "./tx-revert-info-hash-map-element-db-schema-build")

/**
 * Required for consensus. Used only for explorer
 * Stores json info related to revert a Transaction
 *
 */

module.exports = class TxRevertInfoHashVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = TxRevertInfoHashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}