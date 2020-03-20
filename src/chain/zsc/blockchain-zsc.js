const {Helper, Exception, StringHelper} = global.kernel.helpers;
const Zether = global.cryptography.Zether;
const G1Point0 = Zether.utils.G1Point0;

export default class BlockchainZSC extends Zether.ZSC {

    constructor(scope){

        super(undefined, scope.blockchain.genesis.zsc.address );
        this._scope = scope;

    }

    async _getAccMap(hash){

        hash = utils.fromHex( hash );
        const out = await this._scope.chainData.zetherAccountHashMap.getMap(hash);

        if (out)
            return [out.data.point0, out.data.point1];

        return [ G1Point0(), G1Point0() ];
    }

    async _setAccMap(hash, value){

        hash = utils.fromHex( hash );

        if (!value[0].validate()) throw "Point0 is invalid";
        if (!value[1].validate()) throw "Point1 is invalid";

        await this._scope.chainData.zetherAccountHashMap.updateMap(hash, {
            value0: Zether.utils.serializeToBuffer(value[0]),
            value1: Zether.utils.serializeToBuffer(value[1]),
        } )

    }

    async _getPending(hash){

        hash = utils.fromHex( hash );
        const out = await this._scope.chainData.zetherPendingHashMap.getMap(hash);
        if (out)
            return [ out.data.point0, out.data.point1 ];

        return [G1Point0(), G1Point0() ];
    }

    async _setPending(hash, value){
        hash = utils.fromHex( hash );

        if (!value[0].validate()) throw "Point0 is invalid";
        if (!value[1].validate()) throw "Point1 is invalid";

        await this._scope.chainData.zetherAccountHashMap.updateMap(hash, {
            value0: Zether.utils.serializeToBuffer(value[0]),
            value1: Zether.utils.serializeToBuffer(value[1]),
        } );

    }

    async _getLastRollOver(hash){

        hash = utils.fromHex( hash );
        const out = await this._scope.chainData.zetherLastRollOverHashMap.getMap(hash);
        if (out)
            return out.data.epoch;

        return 0;
    }

    async _setLastRollOver(hash, value){

        if (typeof value !== "number") throw new Exception(this, "value is invalid");

        hash = utils.fromHex( hash );
        await this._scope.chainData.zetherLastRollOverHashMap.updateMap( hash, {
            epoch: value,
        } );

    }

    _getEpoch(){
        return Math.floor( this._scope.chainData.end / 10);
    }

}