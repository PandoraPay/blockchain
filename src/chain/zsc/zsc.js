export default class ZSC{

    constructor(scope){

        this._scope = scope;
        super()

    }

    async _getAccMap(hash){
        hash = utils.fromHex( hash );
    }

    async _setAccMap(hash, value){
        hash = utils.fromHex( hash );
    }

    async _getPending(hash){
        hash = utils.fromHex( hash );
    }

    async _setPending(hash, value, index){
        hash = utils.fromHex( hash );
    }

    async _getLastRollOver(hash){
        hash = utils.fromHex( hash );
    }

    async _setLastRollOver(hash, value){
        hash = utils.fromHex( hash );
    }

}