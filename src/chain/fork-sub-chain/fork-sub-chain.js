import SubChain from "../sub-chain/sub-chain";
import ForkSubChainData from "./fork-sub-chain-data";

const {Helper, Exception} = global.protocol.helpers;

export default class ForkSubChain extends SubChain{

    get _chainDataClass(){
        return ForkSubChainData
    }
    
}