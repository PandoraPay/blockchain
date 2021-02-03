const SubChain = require( "../sub-chain/sub-chain");
const ForkSubChainData = require( "./fork-sub-chain-data");

const {Helper, Exception} = require('kernel').helpers;

module.exports = class ForkSubChain extends SubChain{

    constructor(scope) {

        super(scope);

        this.sockets = {};
        this.socketsList = [];
    }


    get _chainDataClassModel(){
        return ForkSubChainData
    }

    get isForkSubChain(){
        return true;
    }
    
}