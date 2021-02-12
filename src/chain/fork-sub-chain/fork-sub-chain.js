const SubChain = require( "../sub-chain/sub-chain");
const ForkSubChainDataModel = require( "./data/fork-sub-chain-data-model");

module.exports = class ForkSubChain extends SubChain{

    constructor(scope) {
        super(scope);
    }

    mergeForks(forkSubchain2){

        this.data.forkEnd = forkSubchain2.data.forkEnd;
        for (let i=0; i < forkSubchain2.data.listHashes.length; i++){

            this.data.pushArray( "listHashes", forkSubchain2.data.listHashes[i].buffer, "object" );
            this.data.pushArray( "listKernelHashes", forkSubchain2.data.listKernelHashes[i].buffer, "object" );

            this.data.hashes[ forkSubchain2.data.listHashes[i].buffer.toString('hex')] = true;
            this.data.kernelHashes[ forkSubchain2.data.listKernelHashes[i].buffer.toString('hex')] = true;
        }

        for (const socket of forkSubchain2.data.socketsList)
            if (!this.data.sockets[socket.id]) {
                this.data.sockets[socket.id] = true;
                this.data.socketsList.push(socket);
            }

    }

    get _chainDataClassModel(){
        return ForkSubChainDataModel
    }

    get isForkSubChain(){
        return true;
    }
    
}