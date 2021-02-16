const {SocketRouterPlugin} = PandoraLibrary.sockets.protocol;

module.exports = class WalletCommonSocketRouterPlugin extends  SocketRouterPlugin {

    getOneWayRoutes(){

        return {

            "wallet/import-priv-key": {
                handle:  this._importPrivKey,
                maxCallsPerSecond:  50,
                descr: "Adds a private key (as returned by dumpprivkey) to your wallet. This may take a while, as a rescan is done, looking for existing transactions "
            },

            "wallet/get-new-address": {
                handle: this._getNewAddress,
                maxCallsPerSecond: 10,
                descr: "Returns a new bitcoin address for receiving payments. If [account] is specified payments received with the address will be credited to [account]. "
            },

            "wallet/list-accounts": {
                handle: this._listAccounts,
                maxCallsPerSecond: 10,
                descr: "Returns a new bitcoin address for receiving payments. If [account] is specified payments received with the address will be credited to [account]. "
            }

        }

    }

    _importPrivKey(){

    }

    _getNewAddress(){

    }

    _listAccounts(){

    }

}