const SubChain = require( "../sub-chain/sub-chain");
const ForkSubChainDataModel = require( "./data/fork-sub-chain-data-model");

module.exports = class ForkSubChain extends SubChain{

    constructor(scope) {
        super(scope);
    }

    mergeForks(forkSubChain2){

        this.data.forkEnd = forkSubChain2.data.forkEnd;
        for (let i=0; i < forkSubChain2.data.listHashes.length; i++){

            this.data.pushArray( "listHashes", forkSubChain2.data.listHashes[i].buffer, "object" );
            this.data.pushArray( "listKernelHashes", forkSubChain2.data.listKernelHashes[i].buffer, "object" );

            this.data.hashes[ forkSubChain2.data.listHashes[i].buffer.toString('hex')] = true;
            this.data.kernelHashes[ forkSubChain2.data.listKernelHashes[i].buffer.toString('hex')] = true;
        }

        for (const socket of forkSubChain2.data.socketsList)
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