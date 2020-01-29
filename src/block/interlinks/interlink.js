const {DBSchema} = global.kernel.marshal.db;
const {Helper} = global.kernel.helpers;

export default class Interlink extends DBSchema {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "link",
                        fixedBytes: 4,
                    },

                    /**
                     * interlink id height:index
                     */

                    id: {
                        default(){
                            return `lk_${this._scope.parent.block.height}_${this.parentIndex}`;
                        },
                    },

                    /**
                     * Input Transaction used for Forging
                     *
                     * Instead of using TxHash, Global_index is used
                     */

                    height: {

                        type: "number",

                        position: 100,

                    },

                    /**
                     * Block hash at specified height
                     */

                    block: {

                        type: "buffer",
                        fixedBytes: 32,

                        removeLeadingZeros: true,

                        position: 101,

                    },

                }

            },
            schema, false), data, type, creationOptions);

    }


}