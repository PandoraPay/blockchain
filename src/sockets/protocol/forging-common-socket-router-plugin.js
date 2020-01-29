const {SocketRouterPlugin} = global.networking.sockets.protocol;

export default class ForgingCommonSocketRouterPlugin extends  SocketRouterPlugin {

    getOneWayRoutes(){

        return {

            "blockchain/get-generate": {
                handle:  this._getGenerate,
                maxCallsPerSecond:  50,
                descr: "Returns true or false whether bitcoind is currently generating hashes"
            },


            "blockchain/get-hashes-per-sec": {
                handle:  this._getHashesPerSec,
                maxCallsPerSecond:  50,
                descr: "Returns a recent hashes per second performance measurement while generating."
            },

        }

    }


    _getGenerate(){
        return this._scope.forging._started;
    }

    _getHashesPerSec(){
        return this._scope.forging._started ? 1 : 0;
    }

}