const {HashVirtualMapDBModel} = require('kernel').dataStructures.hashMap;
const {Helper, Exception} = require('kernel').helpers;

/**
 * Not required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: Block Height, Block Timestamp, Merkle Tree Leaf Height and Merkle Tree Height
 *
 */

const {TxInfoHashMapElementDBSchemaBuilt} = require('./tx-info-hash-map-element-db-schema-build')

module.exports = class TxInfoHashVirtualMapDBModel extends HashVirtualMapDBModel {

    constructor(scope, schema = TxInfoHashMapElementDBSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}