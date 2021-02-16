const {DBModel} = PandoraLibrary.db;

const {TokenDataSchemaBuilt} = require('./token-data-schema-build')

module.exports = class TokenDataModel extends DBModel {

    constructor(scope, schema = TokenDataSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

}