import ForgeBlock from "./forge-block"
const  {setAsyncInterval, clearAsyncInterval} = global.protocol.helpers.AsyncInterval;
const {Helper, Exception} = global.protocol.helpers;

export default class Forging  {

    constructor(scope){

        this._scope = scope;

        /**
         * Started
         */
        this._startedStatus = false;

        /**
         * Reset
         */
        this._reset = false;


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

        this._scope.mainChain.on("blocks/included", ()=>{
            this._reset = true;
        });

        return true;
    }

    async start(){

        if (this._startedStatus) return;

        await this._started();

        this._startedStatus = true;

    }

    async _started(){
        this._scope.logger.info(this, "Forging was started");
        this._reset = true;
        this._forgingInterval = setAsyncInterval( this._forge.bind(this), 300 );
        this._forgingResetHashRateInterval = setInterval( this._resetHashrate.bind(this), 1000);
    }

    async stop(){

        if (!this._startedStatus) return;

        await this._stopped();

        this._startedStatus = false;

    }

    async _stopped(){

        this._reset = true;
        await clearAsyncInterval(this._forgingInterval);
        clearInterval(this._forgingResetHashRateInterval);

        this._scope.logger.info(this, "Forging was stopped");

    }
    
    async _forge(){

        try{

            //create a new block
            if ( this._reset || !this._work.block ){
                this._work.block = await this.forgeBlock. createBlockForging(  );
                if (!this._work.block) return;
                this._work.timestamp = this._work.block.timestamp;
                this._reset = false;
            }

            const out = await this.forgeBlock.forgeBlockWithWallet( this._work.block);

            if (out && !this._scope._reset){

                this._scope.logger.info( this, "BLOCK FORGED", { block: this._work.block.height, timestamp: this._work.block.timestamp, totalDifficulty: this._work.block.totalDifficulty.toString(), target: this._work.block.target.toString("hex") } );
                this._scope.logger.info( this, "target", { target: this._work.block.target.toString("hex") } );

                if ( await this._work.block.validateBlock( this._scope.mainChain ) === false)
                    throw new Exception(this, "Block is invalid");

                if (!this._scope._reset) {

                    const out = await this._scope.mainChain.addBlocks([this._work.block]);

                    if (out && this.onBlockForged)
                        await this.onBlockForged(this._work.block);
                    else
                        this._reset = true;

                }

            }

        }catch(err){
            this._reset = true;

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "Error forging", err);

        }

        
    }

    _resetHashrate(){

        const hashrate = this.forgeBlock.resetHashrate();
        this._scope.logger.log("hashes/s ", hashrate);

    }

}