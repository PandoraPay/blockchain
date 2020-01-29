const {Helper} = global.protocol.helpers;

import BlockInterlinks from "../../interlinks/block-interlinks"

export default class GenesisInterlinks extends BlockInterlinks {

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    links: {
                        minSize: 0,
                        maxSize: 0,
                    },

                }

            },
            schema, false), data, type, creationOptions);

    }


}