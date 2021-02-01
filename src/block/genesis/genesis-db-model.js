const {Helper, Exception} = require('kernel').helpers;

const BlockDBModel = require( "../block-db-model");
const {GenesisDBSchemaBuilt} = require('./genesis-db-schema-build')

module.exports = class GenesisDBModel extends BlockDBModel {

    constructor(scope, schema = GenesisDBSchemaBuilt, data, type , creationOptions ){
        super(scope, schema, data, type, creationOptions);
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