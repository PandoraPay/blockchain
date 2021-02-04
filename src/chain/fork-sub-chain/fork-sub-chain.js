const SubChain = require( "../sub-chain/sub-chain");
const ForkSubChainDataModel = require( "./data/fork-sub-chain-data-model");

const {Helper, Exception} = require('kernel').helpers;

module.exports = class ForkSubChain extends SubChain{

    constructor(scope) {

        super(scope);

        this.sockets = {};
        this.socketsList = [];
    }


    get _chainDataClassModel(){
        return ForkSubChainDataModel
    }

    get isForkSubChain(){
        return true;
    }
    
}