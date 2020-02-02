import SubChainData from "../sub-chain/data/sub-chain-data";
const {Helper, Exception} = global.kernel.helpers;

export default class ForkSubChainData extends SubChainData{

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

                    chainwork:{

                        sorts :{

                            worksort:{

                                filter(){
                                    return !this.ready;
                                },

                                score(){
                                    return this.chainwork.toNumber();
                                },

                            }
                        },

                        position: 301,

                    },

                    forkStart:{
                        type: "number",

                        validation(forkStart){
                            return forkStart >= this.start;
                        },

                        position: 302,
                    },

                    forkEnd:{
                        type: "number",

                        validation(forkEnd){
                            return forkEnd >= this.end;
                        },

                        position: 303,
                    },

                    timestamp: {

                        type: "number",
                        default (){
                            return scope.genesis.settings.getDateNow();
                        },

                        position: 304,

                    },



                }

            },
            schema, false), data, type, creationOptions);


        if (!this.hashes) this.hashes = {};
        if (!this.kernelHashes) this.kernelHashes = {};

    }


}