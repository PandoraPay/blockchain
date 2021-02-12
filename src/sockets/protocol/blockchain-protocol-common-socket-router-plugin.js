const {SocketRouterPlugin} = require('networking').sockets.protocol;
const {Helper, Exception} = require('kernel').helpers;
const {MarshalData} = require('kernel').marshal;
const  {setAsyncInterval, clearAsyncInterval} = require('kernel').helpers.AsyncInterval;
const {BN, BigNumber} = require('kernel').utils;

/**
 * https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
 */


module.exports = class BlockchainProtocolCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._scope.events.on("start/chain-created", ()=>{


        });

        //disconnected, remove socket because it got disconnected
        this._scope.events.on("sockets/disconnected", ({socket}) =>{

            for (let i=this.forkSubChainsList.length-1; i>=0; i--){

                const forkSubChain = this.forkSubChainsList[i];
                if ( forkSubChain.data.sockets[socket.id] ) {

                    delete forkSubChain.data.sockets[socket.id];
                    forkSubChain.data.socketsList.splice(forkSubChain.data.socketsList.indexOf(socket), 1);

                    if ( !forkSubChain.data.socketsList.length) //no more sockets
                        this._deleteForkSubChain(forkSubChain);

                }

            }



        });

        this._scope.events.on("master-cluster/started", ()=> {

        } );


    }

    clear(){

        /**
         * sockets: { },
         * socketsList = [];
         */

        this.forkSubChains = { };
        this.forkSubChainsList = [];

    }

    async _started(){

        this._solveChainsInterval = setAsyncInterval( this._solveForkSubChains.bind(this), 100 );
    }

    async _stopped(){

        await clearAsyncInterval(this._solveChainsInterval);
    }

    getOneWayRoutes(){

        return {

            "blockchain-protocol/new-block":{
                handle:  this._newBlock,
                maxCallsPerSecond:  500,
                descr: "Notification for discovery for a new block"
            },

        }

    }

    async processingFork(forkSubChain, { reqBlocks }){

        //identify fork
        let forkHeight = reqBlocks-2;
        let trials = 0;

        while ( forkHeight >= 0 &&  forkHeight > forkSubChain.data.end - this._scope.argv.blockchain.maxForkAllowed) {

            const socket = this._getForkSubChainSocket(forkSubChain);
            if (!socket) throw new Exception(this, 'Socket is empty');

            //download hash & kernelHash
            const outHashes = await socket.emitAsync('blockchain/get-block-hashes', {index: forkHeight});

            if (!outHashes || typeof outHashes !== "object"){
                trials += 1;
                if (trials < 5) continue;
                else throw new Exception(this, 'blockchain/get-block-hashes returned undefined');
            } else {
                trials = Math.max(0, trials - 0.1);
            }

            let {hash, kernelHash} =  outHashes;

            if (typeof hash === 'string') hash = Buffer.from(hash, 'hex');
            if (typeof kernelHash === 'string') kernelHash = Buffer.from(kernelHash, 'hex');
            if (!Buffer.isBuffer(hash) || hash.length !== 32) throw new Exception(this, 'hash is invalid' );
            if (!Buffer.isBuffer(kernelHash) || kernelHash.length !== 32) throw new Exception(this, 'kernelHash is invalid');

            //let's verify with all other forks, if they match, then we should merge them
            const forkSubChain2 = this._getForkSubChainByBlockHash( hash );
            if (forkSubChain2){
                if (!forkSubChain2.data.processing) {
                    forkSubChain2.mergeForks(forkSubChain);
                    return false;
                }
                return true;
            }

            if (forkSubChain.data.end > forkHeight){

                const mainChainHash = await forkSubChain.data.getBlockHashByHeight(forkHeight);
                if ( hash.equals( mainChainHash ) ) {
                    this._scope.logger.log(this, "FORK IDENTIFIED", forkHeight + 1);
                    return true;
                }

            }

            //to be sure i don't exceed the limit
            forkSubChain.data.forkStart = forkHeight ;
            forkSubChain.data.pushArray("listHashes", hash, "object", undefined, undefined, 0);
            forkSubChain.data.blocksMapByHash[ hash.toString("hex") ] = true;

            forkHeight--;

            if (forkHeight === -1)
                return true;
        }

        return false;

    }

    /**
     * Receiving a notification / tip that a new block was forged and it will create a subChain identify what to download.
     */
    async _newBlock( req, res, socket){

        this._scope.logger.info(this, "new block received", {end: this._scope.mainChain.data.end, chainwork: req.chainwork });

        let reqHash = req.hash.toString('hex');
        let reqKernelHash = req.kernelHash.toString('hex');
        let reqBlocks = req.blocks;

        if (typeof reqBlocks !== "number") throw new Exception(this, 'blocks is not a number');
        if (typeof reqHash === 'string') reqHash = Buffer.from(reqHash, 'hex');
        if (typeof reqKernelHash === 'string') reqKernelHash = Buffer.from(reqKernelHash, 'hex');
        if (!Buffer.isBuffer(reqHash) || reqHash.length !== 32) throw new Exception(this, 'hash is invalid' );
        if (!Buffer.isBuffer(reqKernelHash) || reqKernelHash.length !== 32) throw new Exception(this, 'kernelHash is invalid');

        if (this._scope.mainChain.data.end < req.blocks - this._scope.argv.blockchain.maxForkAllowed ) return this._propagateNewBlock( socket );

        const chainwork = MarshalData.decompressBigNumber( req.chainwork );

        const chainworkComparison = this._scope.mainChain.data.validateChainwork( chainwork, req.blocks);

        if (chainworkComparison === 0) return;
        if ( chainworkComparison < 0) return this._propagateNewBlock(socket);

        /**
         * create a new subChain
         */

        let forkSubChain;
        try{

            forkSubChain = this._getForkSubChainByBlockHash( reqHash );
            const found = !!forkSubChain;
            if (!forkSubChain) {

                //TODO first asking other clusters if they already met this req.hash

                forkSubChain = this._scope.mainChain.createForkSubChain();

                forkSubChain.data.unmarshal({
                    forkStart: req.blocks-1,
                    forkEnd: req.blocks,
                    listHashes: [ reqHash ],
                    chainwork,
                }, "object", undefined, {
                    onlyFields: {
                        forkStart: true,
                        forkEnd: true,
                        listHashes: true,
                        chainwork: true,
                    },
                });

                this.forkSubChains[forkSubChain.data.id] = forkSubChain;
                this.forkSubChainsList.push( forkSubChain );

                forkSubChain.data.blocksMapByHash[ reqHash.toString("hex") ] = true;
            }

            //this._scope.logger.log(this, "chainwork", { "initial value": chainwork.toString(), "data.chainwork": subChain.data.chainwork.toString() } );
            this._fillSocketForkSubChain( forkSubChain, socket );

            if (found)
                return true;

            const ready = await this.processingFork(forkSubChain, { reqBlocks} );
            if ( !ready )
                this._deleteForkSubChain(forkSubChain);
            else
                forkSubChain.data.ready = true;

            this._scope.logger.log(this, "fork found", forkSubChain.data.forkStart);

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, '_newBlock raised an error', err );

            if (forkSubChain)
                this._deleteForkSubChain(forkSubChain);

            throw err;
        }


    }

    async _solveForkSubChains(){

        if ( !this.forkSubChainsList.length ) return;

        /**
         * Sort by chainwork
         */


        let forkSubChain;
        try{

            //getting the best subChain
            for (const fork of this.forkSubChainsList)
                if ( fork.data.isReady() && ( !forkSubChain ||  forkSubChain.data.chainwork.lt( fork.data.chainwork ) ) )
                    forkSubChain = fork;

            if (!forkSubChain) return;

            this._scope.logger.log(this, "SubChains count", this.forkSubChainsList.length );
            for (const fork of this.forkSubChainsList )
                this._scope.logger.log(this, 'Subchain ', {id: fork.data.id, forkEnd: fork.data.forkEnd, forkStart: fork.data.forkStart, isReady: fork.data.isReady(), ready: fork.data.ready, processing: fork.data.processing });
            this._scope.logger.log(this, "subChain.data.chainwork", { "subChain.data.chainwork" :  forkSubChain.data.chainwork.toString(), "mainchain.data.chainwork": this._scope.mainChain.data.chainwork.toString() } );

            if (forkSubChain.data.listBlocks.length && forkSubChain.data.listBlocks[forkSubChain.data.listBlocks.length-1].height === forkSubChain.data.forkEnd - 1 ){

                if (this._scope.argv.debug.enabled)
                    this._scope.logger.log( this, "subChain downloaded successfully" );

                for (let i=0; i < forkSubChain.data.listBlocks.length; i++)
                    this._scope.logger.log( this, "listBlock", forkSubChain.data.listBlocks[i].height );

                forkSubChain.data.processing = true;

                await this._scope.mainChain.addBlocks( forkSubChain.data.listBlocks, forkSubChain.data.sockets );

                if (this._scope.argv.debug.enabled)
                    this._scope.logger.log( this, "subChain process successfully" );

                //success
                this._deleteForkSubChain(forkSubChain);

                return true;
            }

            //selecting a socket
            const socket = this._getForkSubChainSocket( forkSubChain );

            const height = forkSubChain.data.forkStart;

            if (this._scope.argv.debug.enabled)
                this._scope.logger.log(this, "Downloading blk", {height});

            //requesting block
            const blockBuffer = await socket.emitAsync( 'blockchain/get-block-by-height', {index: height}, Math.floor(1.5*this._scope.argv.networkSettings.networkTimeout) );

            if (this._scope.argv.debug.enabled)
                this._scope.logger.log(this, "Downloading blk", {height, blockBuffer: Buffer.isBuffer(blockBuffer) });

            if (!blockBuffer || !Buffer.isBuffer(blockBuffer) ){

                forkSubChain.data.errorDownload += 1;
                if (forkSubChain.data.errorDownload > 5)
                    this._deleteForkSubChain(forkSubChain);

                return false;

            } else
                forkSubChain.data.errorDownload = Math.max(0, forkSubChain.data.errorDownload - 0.1);

            const block = await forkSubChain.createBlock( height );
            if (!block) throw new Exception(this, "block couldn't be created");
            block.fromBuffer(blockBuffer);
            block.height = height;

            await forkSubChain.addBlocks(  [block] );

            forkSubChain.data.forkStart = forkSubChain.data.forkStart + 1 ;
            if (forkSubChain.data.end === block.height)
                forkSubChain.data.end = block.height+1;

        } catch (err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, 'solveForkSubChains raised an error', err );

            if (forkSubChain)
                this._deleteForkSubChain(forkSubChain);

        }


    }

    _propagateNewBlock(sock){

        const blockchainInfo = this._getBlockchainInfo();
        if (!sock._lastBlockPropagatedHash || !sock._lastBlockPropagatedHash.equals( blockchainInfo.hash ) ) {
            sock._lastBlockPropagatedHash = blockchainInfo.hash;
            sock.emit("blockchain-protocol/new-block", blockchainInfo);
        }

        return false;
    }

    async propagateNewBlock(senderSockets){

        const blockchainInfo = this._getBlockchainInfo();
        return this._scope.masterCluster.broadcastToSocketsAsync("blockchain-protocol/new-block", blockchainInfo, undefined, senderSockets, (sock)=>{
             if (!sock._lastBlockPropagatedHash || !sock._lastBlockPropagatedHash.equals( blockchainInfo.hash ) ){
                 sock._lastBlockPropagatedHash = blockchainInfo.hash;
                 return false;
             }
             return true;
        });
    }

    _getBlockchainInfo(){

        const chainData = this._scope.mainChain.data;

        return {
            start: chainData.start,
            blocks: chainData.end,
            hash: chainData.hash,
            kernelHash: chainData.kernelHash,
            prevHash: chainData.prevHash,
            prevKernelHash: chainData.prevKernelHash,
            chainwork: chainData.chainworkBuffer,
        }

    }

    _fillSocketForkSubChain(forkSubChain, socket ){

        if (!forkSubChain.data.sockets[socket.id]){
            forkSubChain.data.sockets[socket.id] = socket;
            forkSubChain.data.socketsList.push( socket  );
        }

    }

    _deleteForkSubChain(forkSubChain){

        this.forkSubChainsList.splice( this.forkSubChainsList.indexOf(forkSubChain), 1);
        delete this.forkSubChains[forkSubChain.data.id];

    }

    _getForkSubChainSocket(forkSubChain){

        const socketIndex = Math.floor( Math.random() * forkSubChain.data.socketsList.length );
        return forkSubChain.data.socketsList[socketIndex];
    }

    _getForkSubChainByBlockHash(blockHash){

        if (Buffer.isBuffer(blockHash)) blockHash = blockHash.toString('hex');

        for (const forkSubChain of this.forkSubChainsList)
            if (forkSubChain.data.blocksMapByHash[blockHash])
                return forkSubChain;

    }

}