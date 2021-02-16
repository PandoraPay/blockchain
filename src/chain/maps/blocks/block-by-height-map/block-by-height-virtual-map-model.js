const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {Helper, Exception} = PandoraLibrary.helpers;

const {BlockByHeightHashMapElementSchemaBuilt} = require( "./block-by-height-map-element-schema-build")

/**
 * Not required for consensus. Used only for explorer
 * It stores height and returns hash
 */

module.exports = class BlockByHeightVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema , data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapSchemaBuilt = BlockByHeightHashMapElementSchemaBuilt;
    }

}