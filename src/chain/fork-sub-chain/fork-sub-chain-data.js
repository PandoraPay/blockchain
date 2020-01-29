import SubChainData from "../sub-chain/data/sub-chain-data";
const {Helper, Exception} = global.protocol.helpers;

export default class ForkSubChainData extends SubChainData{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "fork",
                        fixedBytes: 4,
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
                        }

                    },

                    forkStart:{
                        type: "number",

                        validation(forkStart){
                            return forkStart >= this.start;
                        },

                        position: 300,
                    },

                    forkEnd:{
                        type: "number",

                        validation(forkEnd){
                            return forkEnd >= this.end;
                        },

                        position: 301,
                    },

                    timestamp: {

                        type: "number",
                        default (){
                            return scope.genesis.settings.getDateNow();
                        },

                        position: 302,

                    },

                    ready: {
                        type: "boolean",
                        default: false,

                        position: 303,
                    },

                }

            },
            schema, false), data, type, creationOptions);


        if (!this.hashes) this.hashes = {};
        if (!this.kernelHashes) this.kernelHashes = {};

    }

    async clearData(){

        await super.clearData.call(this);

    }


}