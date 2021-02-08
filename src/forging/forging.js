const  {setAsyncInterval, clearAsyncInterval} = require('kernel').helpers.AsyncInterval;
const {Helper, Exception} = require('kernel').helpers;

const ForgeBlock = require( "./forge-block")

module.exports = class Forging  {

    constructor(scope){

        this._scope = scope;

        /**
         * Started
         */
        this._startedStatus = false;

        /**
         * Reset
         */
        this.reset = false;


        this.forgeBlock = new ForgeBlock({
            ...scope,
            forging: this,
        });

        this._work = {
            block: undefined,
            timestamp: undefined,
        };

        this.onBlockForged = undefined;


        
    }

    initializeForging(){
        return true;
    }

    async start(){

        if (this._startedStatus) return;

        await this._started();

        this._startedStatus = true;

    }

    async _started(){
        this._scope.logger.info(this, "Forging was started");
        this.reset = true;
        this._forgingInterval = setAsyncInterval( this._forge.bind(this), 300 );
        this._forgingResetHashRateInterval = setInterval( this._resetHashrate.bind(this), 1000);
    }

    async stop(){

        if (!this._startedStatus) return;

        await this._stopped();

        this._startedStatus = false;

    }

    async _stopped(){

        this.reset = true;
        await clearAsyncInterval(this._forgingInterval);
        clearInterval(this._forgingResetHashRateInterval);

        this._scope.logger.info(this, "Forging was stopped");

    }
    
    async _forge(){

        try{

            //create a new block
            if ( this.reset || !this._work.block ){
                this._work.block = await this.forgeBlock.createBlockForging(  );
                if (!this._work.block) return;
                this._work.timestamp = this._work.block.timestamp;
                this.reset = false;
            }

            const mined = await this.forgeBlock.forgeBlockWithWallet( this._work.block);

            if (mined && mined.result && !this.reset){

                this._scope.logger.info( this, "BLOCK FORGED", { block: this._work.block.height, timestamp: this._work.block.timestamp, totalDifficulty: this._work.block.totalDifficulty.toString(), target: this._work.block.target.toString("hex") } );
                this._scope.logger.info( this, "target", { target: this._work.block.target.toString("hex") } );

                if ( await this._work.block.validateBlock( this._scope.mainChain ) !== true )
                    throw new Exception(this, "Block is invalid");

                if (!this.reset) {

                    const out = await this._scope.mainChain.addBlocks([this._work.block]);

                    if (out && this.onBlockForged)
                        await this.onBlockForged(this._work.block);
                    else
                        this.reset = true;

                }

            }

        }catch(err){
            this.reset = true;

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Error forging", err);

        }

        
    }

    _resetHashrate(){

        const hashrate = this.forgeBlock.resetHashrate();
        this._scope.logger.log("hashes/s ", hashrate);

    }

}