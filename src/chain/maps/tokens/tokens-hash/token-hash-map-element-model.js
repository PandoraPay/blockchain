const {DBModel} = require('kernel').db;

const {TokenHashMapElementSchemaBuilt} = require('./token-hash-map-element-schema-build')

module.exports = class TokenHashMapElementModel extends DBModel {

    constructor(scope, schema = TokenHashMapElementSchemaBuilt, data, type , creationOptions){
        super(scope, schema, data, type, creationOptions);
    }

}