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

            for (let i=this.forkSubchainsList.length-1; i>=0; i--){

                const forkSubchain = this.forkSubchainsList[i];
                if ( forkSubchain.data.sockets[socket.id] ) {

                    delete forkSubchain.data.sockets[socket.id];
                    forkSubchain.data.socketsList.splice(forkSubchain.data.socketsList.indexOf(socket), 1);

                    if ( !forkSubchain.data.socketsList.length) //no more sockets
                        this._deleteForkSubchain(forkSubchain);

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

        this.forkSubchains = { };
        this.forkSubchainsList = [];

    }

    async _started(){

        this._solveChainsInterval = setAsyncInterval( this._solveForkSubchains.bind(this), 100 );
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

    async processingFork(forkSubchain, { reqBlocks }){

        //identify fork
        let forkHeight = reqBlocks-2;
        let trials = 0;

        while ( forkHeight >= 0 &&  forkHeight > forkSubchain.data.end - this._scope.argv.blockchain.maxForkAllowed) {

            const socket = this._getForkSubchainSocket(forkSubchain);
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
            const forkSubchain2 = this._getForkSubchainByBlockHash( hash );
            if (forkSubchain2){
                if (!forkSubchain2.data.processing) {
                    forkSubchain2.mergeForks(forkSubchain);
                    return false;
                }
                return true;
            }

            if (forkSubchain.data.end > forkHeight){

                const mainChainHash = await forkSubchain.data.getBlockHashByHeight(forkHeight);
                if ( hash.equals( mainChainHash ) ) {
                    this._scope.logger.log(this, "FORK IDENTIFIED", forkHeight + 1);
                    return true;
                }

            }

            //to be sure i don't exceed the limit
            forkSubchain.data.forkStart = forkHeight ;
            forkSubchain.data.pushArray("listHashes", hash, "object", undefined, 0);
            forkSubchain.data.hashes[ hash.toString("hex") ] = true;

            forkSubchain.data.pushArray("listKernelHashes", kernelHash, "object", undefined, 0);
            forkSubchain.data.kernelHashes[ kernelHash.toString("hex") ] = true;

            forkHeight--;

            if (forkHeight === -1)
                return true;
        }

        return false;

    }

    /**
     * Receiving a notification / tip that a new block was forged and it will create a subchain identify what to download.
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
         * create a new subchain
         */

        let forkSubchain;
        try{

            forkSubchain = this._getForkSubchainByBlockHash( reqHash );
            if (!forkSubchain) {

                //TODO first asking other clusters if they already met this req.hash

                forkSubchain = this._scope.mainChain.createForkSubChain();

                forkSubchain.data.unmarshal({
                    forkStart: req.blocks-1,
                    forkEnd: req.blocks,
                    listHashes: [ reqHash ],
                    listKernelHashes: [ reqKernelHash ],
                    chainwork,
                }, "object", undefined, {
                    onlyFields: {
                        forkStart: true,
                        forkEnd: true,
                        listHashes: true,
                        listKernelHashes: true,
                        chainwork: true,
                    },
                });

                this.forkSubchains[forkSubchain.data.id] = forkSubchain;
                this.forkSubchainsList.push( forkSubchain );

                forkSubchain.data.hashes[ reqHash.toString("hex") ] = true;
                forkSubchain.data.kernelHashes[ reqKernelHash.toString("hex") ] = true;
            }

            //this._scope.logger.log(this, "chainwork", { "initial value": chainwork.toString(), "data.chainwork": subchain.data.chainwork.toString() } );

            this._fillSocketForkSubchain( forkSubchain, socket );

            const ready = await this.processingFork(forkSubchain, { reqBlocks} );
            if ( !ready )
                this._deleteForkSubchain(forkSubchain);
            else
                forkSubchain.data.ready = true;

            this._scope.logger.log(this, "fork found", forkSubchain.data.forkStart);

        }catch(err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, '_newBlock raised an error', err );

            if (forkSubchain)
                this._deleteForkSubchain(forkSubchain);

            throw err;
        }


    }

    async _solveForkSubchains(){

        if ( !this.forkSubchainsList.length ) return;

        /**
         * Sort by chainwork
         */


        let forkSubchain;
        try{

            //getting the best subchain
            for (const fork of this.forkSubchainsList)
                if ( fork.data.isReady() && ( !forkSubchain ||  forkSubchain.data.chainwork.lt( fork.data.chainwork ) ) )
                    forkSubchain = fork;

            if (!forkSubchain) return;

            this._scope.logger.log(this, "Subchains count", this.forkSubchainsList.length );
            for (const fork of this.forkSubchainsList )
                this._scope.logger.log(this, 'Subchain ', {id: fork.data.id, forkEnd: fork.data.forkEnd, forkStart: fork.data.forkStart, isReady: fork.data.isReady(), ready: fork.data.ready, processing: fork.data.processing });
            this._scope.logger.log(this, "subchain.data.chainwork", { "subchain.data.chainwork" :  forkSubchain.data.chainwork.toString(), "mainchain.data.chainwork": this._scope.mainChain.data.chainwork.toString() } );

            if (forkSubchain.data.listBlocks.length && forkSubchain.data.listBlocks[forkSubchain.data.listBlocks.length-1].height === forkSubchain.data.forkEnd - 1 ){

                if (this._scope.argv.debug.enabled)
                    this._scope.logger.log( this, "subchain downloaded successfully" );

                for (let i=0; i < forkSubchain.data.listBlocks.length; i++)
                    this._scope.logger.log( this, "listBlock", forkSubchain.data.listBlocks[i].height );

                forkSubchain.data.processing = true;

                await this._scope.mainChain.addBlocks( forkSubchain.data.listBlocks, forkSubchain.data.sockets );

                if (this._scope.argv.debug.enabled)
                    this._scope.logger.log( this, "subchain process successfully" );

                //success
                this._deleteForkSubchain(forkSubchain);

                return true;
            }

            //selecting a socket
            const socket = this._getForkSubchainSocket( forkSubchain );

            const height = forkSubchain.data.forkStart;

            if (this._scope.argv.debug.enabled)
                this._scope.logger.log(this, "Downloading blk", {height});

            //requesting block
            const blockBuffer = await socket.emitAsync( 'blockchain/get-block-by-height', {index: height}, Math.floor(1.5*this._scope.argv.networkSettings.networkTimeout) );

            if (this._scope.argv.debug.enabled)
                this._scope.logger.log(this, "Downloading blk", {height, blockBuffer: Buffer.isBuffer(blockBuffer) });

            if (!blockBuffer || !Buffer.isBuffer(blockBuffer) ){

                forkSubchain.data.errorDownload += 1;
                if (forkSubchain.data.errorDownload > 5)
                    this._deleteForkSubchain(forkSubchain);

                return false;

            } else
                forkSubchain.data.errorDownload = Math.max(0, forkSubchain.data.errorDownload - 0.1);

            const block = await forkSubchain.createBlock( height );
            if (!block) throw new Exception(this, "block couldn't be created");
            block.fromBuffer(blockBuffer);
            block.height = height;

            await forkSubchain.addBlocks(  [block] );

            forkSubchain.data.forkStart = forkSubchain.data.forkStart + 1 ;

        } catch (err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, 'solveForkSubchains raised an error', err );

            if (forkSubchain)
                this._deleteForkSubchain(forkSubchain);

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

    _fillSocketForkSubchain(forkSubchain, socket ){

        if (!forkSubchain.data.sockets[socket.id]){
            forkSubchain.data.sockets[socket.id] = socket;
            forkSubchain.data.socketsList.push( socket  );
        }

    }

    _deleteForkSubchain(forkSubchain){

        this.forkSubchainsList.splice( this.forkSubchainsList.indexOf(forkSubchain), 1);
        delete this.forkSubchains[forkSubchain.data.id];

    }

    _getForkSubchainSocket(forkSubchain){

        const socketIndex = Math.floor( Math.random() * forkSubchain.data.socketsList.length );
        return forkSubchain.data.socketsList[socketIndex];
    }

    _getForkSubchainByBlockHash(blockHash){

        if (Buffer.isBuffer(blockHash)) blockHash = blockHash.toString('hex');

        for (const forkSubchain of this.forkSubchainsList)
            if (forkSubchain.data.hashes[blockHash])
                return forkSubchain;

    }

}