const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception} = global.kernel.helpers;

export default class AddressHashMapData extends DBSchema {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                txsCount: {
                    type: "number",
                    position: 100,
                },

            },

            saving:{
                storeDataNotId: true,
            },

        }, schema, false), data, type, creationOptions);

    }

}