
const {Helper, Exception} = require('kernel').helpers;

const Block = require( "../block");
const GenesisInterlinks = require("./interlinks/genesis-interlinks");

module.exports = class Genesis extends Block{

    constructor(scope, schema = { }, data, type , creationOptions ){

        super(scope, Helper.merge( {

                fields:{

                    height: {
                        default: 0,
                        validation(height){
                            return height === 0;
                        }
                    },

                    prevHash: {
                        default: scope.genesis.settings.prevHash,
                        validation(prevHash){
                            return prevHash.equals( scope.genesis.settings.prevHash );
                        }
                    },

                    prevKernelHash:{
                        default: scope.genesis.settings.prevKernelHash,
                        validation(prevKernelHash){
                            return prevKernelHash.equals(scope.genesis.settings.prevKernelHash);
                        }
                    },

                    target: {
                        default: scope.genesis.settings.target,
                        validation(target){
                            return target.equals( scope.genesis.settings.target );
                        }
                    },

                    timestamp : {
                        default: 0,
                    },

                    // interlinks: {
                    //     classObject: GenesisInterlinks,
                    // },


                }

            },
            schema, false), data, type, creationOptions);


    }

    get settings(){
        return this._scope.genesis.settings;
    }

    async _validateBlockInfo(chain = this._scope.chain, chainData = chain.data){

        /**
         * validate prevHash
         */

        if (!this.prevHash.equals( this.settings.prevHash  ))
            throw new Exception(this, "prevHash doesn't match with Genesis", {prevHash: this.prevHash });

        /**
         * validate target
         */
        if (!this.target.equals( this.settings.target ))
            throw new Exception(this, "target doesn't match with Genesis", {target: this.settings.target });

        /**
         * Validate prevKernelHash
         */

        if (!this.prevKernelHash.equals( this.settings.prevKernelHash ))
            throw new Exception(this, "kernel hash doesn't match with Genesis", {kernelHash: this.settings.prevKernelHash });

        /**
         * Validate Genesis PublicKeyHash
         */
        if (!this.pos.stakeForgerPublicKeyHash.equals( this.settings.stakes.publicKeyHash  ) )
            throw new Exception(this, "stake forger public key hash doesn't match with Genesis", { publicKeyHash: this.settings.stakes.publicKeyHash });

        return true;
    }


}