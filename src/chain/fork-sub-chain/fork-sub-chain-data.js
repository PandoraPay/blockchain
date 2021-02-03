const SubChainData = require( "../sub-chain/data/sub-chain-data-model");
const {Helper, Exception} = require('kernel').helpers;

module.exports = class ForkSubChainData extends SubChainData{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "fork",
                        fixedBytes: 4,
                    },

                    ready: {
                        type: "boolean",
                        default: false,

                        position: 300,
                    },

                    processing: {
                        type: "boolean",
                        default: false,

                        position: 301,
                    },

                    chainwork:{

                        position: 302,

                    },

                    forkStart:{
                        type: "number",

                        validation(forkStart){
                            return forkStart >= this.start;
                        },

                        position: 303,
                    },

                    forkEnd:{
                        type: "number",

                        position: 304,
                    },

                    timestamp: {

                        type: "number",
                        default (){
                            return scope.genesis.settings.getDateNow();
                        },

                        position: 305,

                    },



                }

            },
            schema, false), data, type, creationOptions);

        this.errorDownload = 0;

    }

    isReady(){
        return this.ready && !this.processing;
    }

    score(){
        return this.chainwork;
    }


}