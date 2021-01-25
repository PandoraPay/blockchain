const {Helper} = require('kernel').helpers;

const BlockInterlinks = require( "../../interlinks/block-interlinks")

module.exports = class GenesisInterlinks extends BlockInterlinks {

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