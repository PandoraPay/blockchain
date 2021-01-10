const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception} = global.kernel.helpers;
const {MarshalData} = global.kernel.marshal;
const  {setAsyncInterval, clearAsyncInterval} = global.kernel.helpers.AsyncInterval;
const {BN, BigNumber} = global.kernel.utils;

/**
 * https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
 */

import Block from "src/block/block";

export default class BlockchainProtocolCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._scope.events.on("start/chain-created", ()=>{


        });

        //disconnected, remove socket because it got disconnected
        this._scope.events.on("sockets/disconnected", ({socket}) =>{

            for (let i=this.forkSubchainsList.length-1; i>=0; i--){

                const forkSubchain = this.forkSubchainsList[i];
                if ( forkSubchain.sockets[socket.id] ) {

                    delete forkSubchain.sockets[socket.id];
                    forkSubchain.socketsList.splice(forkSubchain.socketsList.indexOf(socket), 1);

                    if (forkSubchain.socketsList.length === 0) //no more sockets
                        this._deleteForkSubchain(forkSubchain);

                }

            }



        });

        this._scope.events.on("master-cluster/started", ()=> this.initializePluginMasterCluster() );


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

        //this._scope.logger.log(this, "started");
        this._solveChainsInterval = setAsyncInterval( this._solveForkSubchains.bind(this), 100 );
    }

    async initializePluginMasterCluster(){

        /**
         * Notification that an existing subchain was updated
         */

        if (this._scope.db.isSynchronized){

            await this._scope.mainChain.dataSubscription.subscribe();

            this._scope.mainChain.dataSubscription.subscription.on( message => {

                //it the message was sent by me
                if (message.except && message.except === this._scope.masterCluster.workerName) return;

                const id = message.data.forkSubchain;

                if (message.name === "new-hash" && this.forkSubchains[message.data.forkSubchain]){

                    if ( message.forkEnd - this.forkSubchains[id].data.forkEnd === message.newKernelHashes.length && message.newKernelHashes.length === message.data.newHashes.length ){

                        this.forkSubchains[id].data.forkEnd = Math.max( this.forkSubchains[id].data.forkEnd, message.forkEnd);
                        this.forkSubchains[id].data.forkStart = Math.min( this.forkSubchains[id].data.forkStart, message.forkStart);

                        for ( const kernelHash of message.data.newKernelHashes)
                            if ( !this.forkSubchains[id].data.listKernelHashes.reduce( (res, listKernelHash) => res || listKernelHash.buffer.equals( kernelHash ), false ) )
                                this.forkSubchains[id].data.pushArray( "listKernelHashes", kernelHash );

                        for ( const hash of message.data.newHashes)
                            if ( !this.forkSubchains[id].data.listHashes.reduce( (res, listHash) => res || listHash.buffer.equals( hash ), false ) )
                                this.forkSubchains[id].data.pushArray( "listHashes", hash )

                    }

                }

                if (message.name === "delete-chain" && this.forkSubchains[id])
                    this._deleteForkSubchain( this.forkSubchains[id] );

            });


        }


    }

    async _stopped(){

        if (this._scope.mainChain.dataSubscription.subscription)
            await this._scope.mainChain.dataSubscription.subscription.off();

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

    /**
     * Receiving a notification / tip that a new block was forged and it will create a subchain identify what to download.
     */
    async _newBlock( req, res, socket){

        this._scope.logger.info(this, "new block received", {end: this._scope.mainChain.data.end, chainwork: req.chainwork });

        let reqHash = req.hash.toString('hex');
        let reqKernelHash = req.kernelHash.toString('hex');

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
                    forkStart: req.blocks - 1,
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

                forkSubchain.data.hashes[ reqHash.toString("hex") ] = true;
                forkSubchain.data.kernelHashes[ reqKernelHash.toString("hex") ] = true;

            }

            //this._scope.logger.log(this, "chainwork", { "initial value": chainwork.toString(), "data.chainwork": subchain.data.chainwork.toString() } );

            this._fillSocketForkSubchain( forkSubchain, socket );

            //identify fork
            let forkHeight = req.blocks-1;

            do {

                const socket = this._getForkSubchainSocket(forkSubchain);
                if (!socket) throw new Exception(this, 'Socket is empty');

                let hash, kernelHash;

                //download hash and kernelHash
                if ( forkHeight === req.blocks-1 ) { //last block, no download
                    hash = reqHash;
                    kernelHash = reqKernelHash;
                }
                else { //download hash & kernelHash
                    const blockHashes = await socket.emitAsync('blockchain/get-block-hashes', {index: forkHeight});

                    if (!blockHashes || typeof blockHashes !== "object") throw new Exception(this, 'blockchain/get-block-hashes returned undefined');

                    hash =  blockHashes.hash;
                    kernelHash =  blockHashes.kernelHash;
                }

                if (typeof hash === 'string') hash = Buffer.from(hash, 'hex');
                if (typeof kernelHash === 'string') kernelHash = Buffer.from(kernelHash, 'hex');
                if (!Buffer.isBuffer(hash) || hash.length !== 32) throw new Exception(this, 'hash is invalid' );
                if (!Buffer.isBuffer(kernelHash) || kernelHash.length !== 32) throw new Exception(this, 'kernelHash is invalid');

                //TODO asking if this hash/kernel was already found somewhere else
                //if yes propagate the list

                //let's verify with all other forks, if they match, then we should merge them
                const forkSubchain2 = this._getForkSubchainByBlockHash( hash );
                if (forkSubchain2 && forkSubchain2 !== forkSubchain)
                    break;

                if (this._scope.mainChain.data.end > forkHeight){

                    const forkSubchainHash = await forkSubchain.data.getBlockHash(forkHeight);

                    if (forkSubchainHash && hash.equals( forkSubchainHash )) {
                        forkHeight++;
                        this._scope.logger.log(this, "FORK IDENTIFIED", forkHeight);
                        break;
                    }

                }

                //to be sure i don't exceed the limit
                if (forkSubchain.data.listHashes.length >= this._scope.argv.blockchain.maxForkAllowed - 1 )
                    break;

                forkSubchain.data.forkStart = forkHeight ;
                forkSubchain.data.pushArray("listHashes", hash, "object", undefined, 0);
                forkSubchain.data.hashes[ hash.toString("hex") ] = true;

                forkSubchain.data.pushArray("listKernelHashes", kernelHash, "object", undefined, 0);
                forkSubchain.data.kernelHashes[ kernelHash.toString("hex") ] = true;

                forkHeight--;

            } while ( forkHeight >= 0 &&  forkHeight >= this._scope.mainChain.data.end - this._scope.argv.blockchain.maxForkAllowed); //there are is still sockets

            /**
             * TODO update only ready
             */
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

            this._scope.logger.log(this, "Subchains count", this.forkSubchainsList.length );
            for (const fork of this.forkSubchainsList )
                this._scope.logger.log(this, 'Subchain ', {id: fork.data.id, forkEnd: fork.data.forkEnd, forkStart: fork.data.forkStart, isReady: fork.data.isReady() });

            //getting the best subchain
            for (const fork of this.forkSubchainsList)
                if ( fork.data.isReady() && ( !forkSubchain ||  forkSubchain.data.chainwork.lt( fork.data.chainwork ) ) ){
                    forkSubchain = fork;
                }

            if (!forkSubchain) return;

            //this._scope.logger.log(this, "subchain.data.chainwork", { "subchain.data.chainwork" :  subchain.data.chainwork.toString(), "mainchain.data.chainwork": this._scope.mainChain.data.chainwork.toString() } );

            for (const fork of this.forkSubchainsList)
                if (!forkSubchain || forkSubchain.forkStart > fork.forkStart){
                    forkSubchain = fork;
                    break;
                }

            //Not ready
            if (!forkSubchain.data.ready || forkSubchain.data.processing) return;

            //download first block
            const height = forkSubchain.data.forkStart + forkSubchain.data.listBlocks.length;

            if (height === forkSubchain.data.forkEnd){

                if (this._scope.argv.debug.enabled)
                    this._scope.logger.log( this, "subchain downloaded successfully" );

                for (let i=0; i < forkSubchain.data.listBlocks.length; i++)
                    this._scope.logger.log( this, "listBlock", forkSubchain.data.listBlocks[i].height );

                forkSubchain.data.processing = true;
                await this._scope.mainChain.addBlocks( forkSubchain.data.listBlocks, forkSubchain.sockets );

                //success
                this._deleteForkSubchain(forkSubchain);
                return true;

            }

            //selecting a socket
            const socket = this._getForkSubchainSocket( forkSubchain );

            this._scope.logger.log(this, "Download height", height);

            //requesting block
            const blockBuffer = await socket.emitAsync( 'blockchain/get-block-by-height', {index: height}, 2 * this._scope.argv.networkSettings.networkTimeout );

            if (!blockBuffer || !Buffer.isBuffer(blockBuffer)) throw new Exception(this, "block received is invalid", {index: height});

            const block = await forkSubchain.createBlock( height );
            if (!block) throw new Exception(this, "block couldn't be created");
            block.fromBuffer(blockBuffer);
            block.height = height;

            await forkSubchain.addBlocks(  [block] );

        } catch (err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, 'solveForkSubchains raised an error', err );

            if (forkSubchain) {

                if (err && typeof err === "object" && err.message === "block received is invalid") {

                    forkSubchain.data.errorDownload += 1;
                    if (forkSubchain.data.errorDownload > 10)
                        this._deleteForkSubchain(forkSubchain);

                }else
                this._deleteForkSubchain(forkSubchain);

            }

        }


    }

    _propagateNewBlock(sock){
        sock.emit("blockchain-protocol/new-block", this._getBlockchainInfo() );
        return false;
    }

    async propagateNewBlock(senderSockets){
        return this._scope.masterCluster.broadcastToSocketsAsync("blockchain-protocol/new-block", this._getBlockchainInfo(), senderSockets);
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

        const id = forkSubchain.data.id;

        if (!this.forkSubchains[id]) {

            this.forkSubchains[id] = forkSubchain;
            this.forkSubchainsList.push( forkSubchain );


        }

        if (!forkSubchain.sockets[socket.id]){
            forkSubchain.sockets[socket.id] = socket;
            forkSubchain.socketsList.push( socket  );
        }


    }

    _deleteForkSubchain(forkSubchainId){

        if (typeof forkSubchainId === "object") forkSubchainId = forkSubchainId.data.id;

        if (this.forkSubchains[forkSubchainId]) {
            this.forkSubchainsList.splice( this.forkSubchainsList.indexOf(this.forkSubchains[forkSubchainId]), 1);
            delete this.forkSubchains[forkSubchainId];
        }

    }

    _getForkSubchainSocket(forkSubchain){

        const socketIndex = Math.floor( Math.random() * forkSubchain.socketsList.length );
        return forkSubchain.socketsList[socketIndex];
    }

    _getForkSubchainSockets(forkSubchainId){

        if (typeof forkSubchainId === "object") forkSubchainId = forkSubchainId.data.id;

        return this.forkSubchains[forkSubchainId].sockets;
    }

    _getForkSubchainByBlockHash(blockHash){

        if (Buffer.isBuffer(blockHash)) blockHash = blockHash.toString('hex');

        for (let i=0; i < this.forkSubchainsList.length; i++)
            if (this.forkSubchainsList[i].data.hashes[blockHash])
                return this.forkSubchainsList[i];


    }

}