import SubChain from "../sub-chain/sub-chain";
import ForkSubChainData from "./fork-sub-chain-data";

const {Helper, Exception} = global.kernel.helpers;

export default class ForkSubChain extends SubChain{

    constructor(scope) {

        super(scope);

        this.sockets = {};
        this.socketsList = [];
    }


    get _chainDataClass(){
        return ForkSubChainData
    }
    
}