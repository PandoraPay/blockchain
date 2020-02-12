const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception} = global.kernel.helpers;
const  {setAsyncInterval, clearAsyncInterval} = global.kernel.helpers.AsyncInterval;
const {MarshalData} = global.kernel.marshal;

/**
 * https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
 */

import Block from "src/block/block";

export default class BlockchainProtocolCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._scope.events.on("start/chain-created", ()=>{

            this._scope.mainChain.on( "blocks/included", ( {data, senderSockets } ) => {

                /**
                 * Sending notification that a new block was received
                 */

                this._scope.masterCluster.broadcast("blockchain-protocol/new-block", this._getBlockchainInfo(), senderSockets);


            });

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

            forkSubchain = this._getForkSubchainByBlockHash(req.hash.toString("hex") );
            if (!forkSubchain) {


                //TODO first asking other clusters if they already met this req.hash

                forkSubchain = this._scope.mainChain.createForkSubChain();

                forkSubchain.data.unmarshal({
                    forkStart: req.blocks - 1,
                    forkEnd: req.blocks,
                    listHashes: [{
                        buffer: req.hash,
                    }],
                    listKernelHashes: [{
                        buffer: req.kernelHash,
                    }],
                    chainwork: chainwork,
                }, "object", undefined, {
                    onlyFields: {
                        forkStart: true,
                        forkEnd: true,
                        listHashes: true,
                        listKernelHashes: true,
                        listSockets: true,
                        chainwork: true,
                    },
                });

            }

            //this._scope.logger.log(this, "chainwork", { "initial value": chainwork.toString(), "data.chainwork": subchain.data.chainwork.toString() } );

            this._fillSocketForkSubchain( forkSubchain, socket );

            //identify fork
            let forkHeight = req.blocks-1;

            do {

                const socket = this._getForkSubchainSocket(forkSubchain.data.id);

                let hash, kernelHash;

                //download hash and kernelHash
                if ( forkHeight === req.blocks-1 ) { //last block, no download
                    hash = req.hash;
                    kernelHash = req.kernelHash;
                }
                else { //download hash & kernelHash
                    const blockHashes = await socket.emitAsync('blockchain/get-block-hashes', {index: forkHeight});
                    hash =  blockHashes.hash;
                    kernelHash =  blockHashes.kernelHash;
                }

                if (!hash || !Buffer.isBuffer(hash) || !kernelHash || !Buffer.isBuffer(kernelHash))
                    throw new Exception(this, "Hash or KernelHash was not received");

                if (this._scope.mainChain.data.end > forkHeight){

                    const forkSubchainHash = await forkSubchain.data.getBlockHash(forkHeight);

                    if (forkSubchainHash && hash && hash.equals( forkSubchainHash )) {
                        forkHeight++;
                        this._scope.logger.log(this, "FORK IDENTIFIED", forkHeight);
                        break;
                    }

                }

                //TODO asking if this hash/kernel was already found somewhere else
                //if yes propagate the list

                forkSubchain.data.forkStart = forkHeight ;

                if ( !forkSubchain.data.hashes[hash.toString("hex")]  ) {
                    forkSubchain.data.pushArray("listHashes", {buffer: hash}, "object");
                    forkSubchain.data.hashes[ hash.toString("hex") ] = true;
                }

                if ( !forkSubchain.data.kernelHashes[kernelHash.toString("hex")] ) {
                    forkSubchain.data.pushArray("listKernelHashes", {buffer: kernelHash}, "object");
                    forkSubchain.data.kernelHashes[ kernelHash.toString("hex") ] = true;
                }

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

        this._scope.logger.log(this, "Subchains count", this.forkSubchainsList.length );

        this.forkSubchainsList.sort(
            (a, b) => !a.data._schema.fields.chainwork.sorts.worksort.filter.call(a.data) ? a.data._schema.fields.chainwork.sorts.worksort.score.call(a.data) : 0 -
                                 !b.data._schema.fields.chainwork.sorts.worksort.filter.call(b.data) ? b.data._schema.fields.chainwork.sorts.worksort.score.call(b.data) : 0 );

        //getting the best subchain
        const forkSubchain = this.forkSubchainsList[0];

        try{

            //this._scope.logger.log(this, "subchain.data.chainwork", { "subchain.data.chainwork" :  subchain.data.chainwork.toString(), "mainchain.data.chainwork": this._scope.mainChain.data.chainwork.toString() } );

            const workchainComparison = this._scope.mainChain.data.validateChainwork( forkSubchain.data.chainwork, forkSubchain.data.end );
            if ( workchainComparison <= 0)
                throw new Exception(this, "chainwork is less now");

            //Not ready
            if (!forkSubchain.data.ready || forkSubchain.data.processing) return;

            //download first block
            const height = forkSubchain.data.forkStart + forkSubchain.data.listBlocks.length;

            if (height === forkSubchain.data.forkEnd){

                if (this._scope.argv.debug.enabled)
                    this._scope.logger.log( this, "subchain downloaded successfully" );

                forkSubchain.data.processing = true;
                await this._scope.mainChain.addBlocks( forkSubchain.data.listBlocks, forkSubchain.sockets );

                //success
                this._deleteForkSubchain(forkSubchain);
                return true;

            }

            //selecting a socket
            const socket = this._getForkSubchainSocket( forkSubchain.data.id);

            this._scope.logger.log(this, "Download height", height);

            //requesting block
            const blockBuffer = await socket.emitAsync( 'blockchain/get-block-by-height', {index: height} );

            if (!blockBuffer || !Buffer.isBuffer(blockBuffer)) throw new Exception(this, "block received is invalid", {index: height});

            const block = await forkSubchain.createBlock( height );
            block.fromBuffer(blockBuffer);
            block.height = height;

            await forkSubchain.addBlocks(  [block] );

        } catch (err){

            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, 'solveForkSubchains raised an error', err );

            if (forkSubchain) {

                if (err.message === "block received is invalid") {

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

            this.forkSubchains[id] = {
                subchain: forkSubchain,
                sockets: {},
                socketsList: [],
            };

            this.forkSubchainsList.push( forkSubchain );

        }

        if (!this.forkSubchains[id].sockets[socket.id]){
            this.forkSubchains[id].sockets[socket.id] = socket;
            this.forkSubchains[id].socketsList.push( socket.id );
        }

        socket.on("disconnect", ()=>{

            delete this.forkSubchains[id].sockets[socket.id];
            const index = this.forkSubchains[id].socketsList.indexOf(socket.id);
            this.forkSubchains[id].socketsList.splice(index, 1);

            if (this.forkSubchains[id].socketsList.length === 0)
                this._deleteForkSubchain(forkSubchain);

        });

    }

    _deleteForkSubchain(forkSubchainId){

        if (typeof forkSubchainId === "object") forkSubchainId = forkSubchainId.data.id;

        this.forkSubchainsList.splice(  this.forkSubchainsList.indexOf( this.forkSubchains[forkSubchainId] ), 1 );
        delete this.forkSubchains[forkSubchainId];

    }

    _getForkSubchainSocket(forkSubchainId){

        if (typeof forkSubchainId === "object") forkSubchainId = forkSubchainId.data.id;

        const socketIndex = Math.floor( Math.random() * this.forkSubchains[forkSubchainId].socketsList.length );
        const socketId = this.forkSubchains[forkSubchainId].socketsList[socketIndex];
        return this.forkSubchains[forkSubchainId].sockets[socketId];
    }

    _getForkSubchainSockets(forkSubchainId){

        if (typeof forkSubchainId === "object") forkSubchainId = forkSubchainId.data.id;

        return this.forkSubchains[forkSubchainId].sockets;
    }

    _getForkSubchainByBlockHash(blockHash){

        for (let i=0; i < this.forkSubchainsList.length; i++)
            if (this.forkSubchainsList[i].hashes[blockHash])
                return this.forkSubchainsList[i];


    }

}