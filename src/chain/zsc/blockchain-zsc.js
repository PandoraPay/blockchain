const {Helper, Exception, StringHelper} = global.kernel.helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

const Zether = global.cryptography.zether;

const G1Point0 = Zether.utils.G1Point0;
const G1Point0Const = Zether.utils.G1Point0Const;

export default class BlockchainZSC extends Zether.ZSC {

    constructor(scope){

        super(undefined, scope.argv.blockchain.genesis.zsc.address );

        this._scope = scope;
    }

    async getAccount(publicKey){

        publicKey = Zether.bn128.unserializeFromBuffer(publicKey);

        const tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id;

        const yHash = Zether.utils.keccak256( Zether.utils.encodedPackaged( Zether.bn128.serialize( publicKey ) ) );
        const registered = await this.registered( yHash );

        const acc = await this.getAccMapObject( yHash );
        const pending = await this.getPendingMapObject( yHash );
        const lastRollOver = await this.getLastRollOverMapObject( yHash );

        const balances = [];
        if (acc || pending || lastRollOver){
            balances.push({
                tokenCurrency,
                acc,
                pending,
                lastRollOver
            })
        }

        return {
            registered,
            balances,
        };

    }

    async getBalances(publicKey, privateKey){

        publicKey = Zether.bn128.unserializeFromBuffer(publicKey);
        privateKey = Zether.utils.BNFieldfromHex(privateKey);

        const tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id;

        const result = await this.simulateAccounts([ publicKey ], this._getEpoch() + 1);
        if (!result) return undefined;

        const simulated = result[0];

        const balances = {};

        balances[tokenCurrency.toString('hex')] = this.readBalance( simulated[0], simulated[1], privateKey );

        return balances;
    }

    async getBalance(publicKey, privateKey, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id ){

        publicKey = Zether.bn128.unserializeFromBuffer(publicKey);
        privateKey = Zether.utils.BNFieldfromHex(privateKey);

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        await this._scope.chainData.tokenHashMap.currencyExists(tokenCurrency);

        const result = await this.simulateAccounts([ publicKey ], this._getEpoch() + 1);
        if (!result) return undefined;

        const simulated = result[0];

        return this.readBalance( simulated[0], simulated[1], privateKey );

    }



    async _deleteAccMap(hash){
        return this._scope.chainData.zetherAccountHashMap.deleteMap( Zether.utils.fromHex( hash ) );
    }

    async _getAccMap(hash){

        hash = Zether.utils.fromHex( hash );
        const out = await this._scope.chainData.zetherAccountHashMap.getMap(hash);

        if (out) return [out.data.point0, out.data.point1];

        return [ G1Point0(), G1Point0() ];
    }

    async getAccMapObject(hash){
        hash = Zether.utils.fromHex( hash );
        const out = await this._scope.chainData.zetherAccountHashMap.getMap(hash);

        if (out) return {
            value0: out.data.value0,
            value1: out.data.value1,
        };

        return null;
    }

    async _setAccMap(hash, value){

        hash = Zether.utils.fromHex( hash );

        if (!value[0].validate()) throw "Point0 is invalid";
        if (!value[1].validate()) throw "Point1 is invalid";

        return this._scope.chainData.zetherAccountHashMap.updateMap(hash, {
            value0: Zether.bn128.serializeToBuffer(value[0]),
            value1: Zether.bn128.serializeToBuffer(value[1]),
        } )

    }

    async setAccMapObject(hash, value){

        hash = Zether.utils.fromHex( hash );

        if (value === null) return this._deleteAccMap( hash );

        const point0 = Zether.bn128.unserializeFromBuffer(value[0]);
        if (!point0.validate() ) throw "Point0 is invalid";
        const point1 = Zether.bn128.unserializeFromBuffer(value[1]);
        if (!point1.validate() ) throw "Point1 is invalid";

        return this._scope.chainData.zetherAccountHashMap.updateMap(hash, {
            value0: value.value0,
            value1: value.value1,
        } )
    }





    async _deletePendingMap(hash){
        return this._scope.chainData.zetherPendingHashMap.deleteMap( Zether.utils.fromHex( hash ) );
    }

    async _getPendingMap(hash){

        hash = Zether.utils.fromHex( hash );
        const out = await this._scope.chainData.zetherPendingHashMap.getMap(hash);

        if (out) return [ out.data.point0, out.data.point1 ];

        return [G1Point0(), G1Point0()];
    }

    async getPendingMapObject(hash){
        hash = Zether.utils.fromHex( hash );
        const out = await this._scope.chainData.zetherPendingHashMap.getMap(hash);

        if (out) return {
            value0: out.data.value0,
            value1: out.data.value1,
        };

        return null;
    }

    async _setPendingMap(hash, value){

        hash = Zether.utils.fromHex( hash );

        if (!value[0].validate()) throw "Point0 is invalid";
        if (!value[1].validate()) throw "Point1 is invalid";

        return this._scope.chainData.zetherPendingHashMap.updateMap(hash, {
            value0: Zether.bn128.serializeToBuffer(value[0]),
            value1: Zether.bn128.serializeToBuffer(value[1]),
        } );

    }

    async setPendingMapObject(hash, value){

        hash = Zether.utils.fromHex( hash );

        if (value === null) return this._deletePendingMap( hash );

        const point0 = Zether.bn128.unserializeFromBuffer(value[0]);
        if (!point0.validate() ) throw "Point0 is invalid";
        const point1 = Zether.bn128.unserializeFromBuffer(value[1]);
        if (!point1.validate() ) throw "Point1 is invalid";

        return this._scope.chainData.zetherPendingHashMap.updateMap(hash, {
            value0: value.value0,
            value1: value.value1,
        } )

    }




    async _deletetLastRollOverMap(hash){
        return this._scope.chainData.zetherLastRollOverHashMap.deleteMap( Zether.utils.fromHex( hash ) );
    }


    async _getLastRollOverMap(hash){

        hash = Zether.utils.fromHex( hash );
        const out = await this._scope.chainData.zetherLastRollOverHashMap.getMap(hash);

        if (out) return out.data.epoch;

        return 0;
    }

    async getLastRollOverMapObject(hash){
        hash = Zether.utils.fromHex( hash );
        const out = await this._scope.chainData.zetherLastRollOverHashMap.getMap(hash);
        if (out) return out.data.epoch;
        return null;
    }

    async _setLastRollOverMap(hash, value){

        if (typeof value !== "number") throw new Exception(this, "value is invalid");

        hash = Zether.utils.fromHex( hash );
        await this._scope.chainData.zetherLastRollOverHashMap.updateMap( hash, {
            epoch: value,
        } );

    }

    async setLastRollOverMapObject(hash, value){
        hash = Zether.utils.fromHex( hash );

        if (value === null) return this._deletetLastRollOverMap( hash );

        await this._scope.chainData.zetherLastRollOverHashMap.updateMap( hash, {
            epoch: value,
        } );
    }



    _getNonceSetAll(){
        return this._scope.chainData.zscListNonceSet.map( it => it.buffer );
    }

    _setNonceSetAll(nonceSet){
        this._scope.chainData.zscListNonceSet = nonceSet.map( it => ({buffer: it }));
        this._scope.chainData.zscNoncesMap = {};
        nonceSet.map( it => {
            this._scope.chainData.zscNoncesMap[it] = true;
        })
    }

    _getNonceSet(uHash){
        uHash = Zether.utils.fromHex(uHash);
        return this._scope.chainData.zscNoncesMap[uHash];
    }

    async _setNonceSet(uHash){
        uHash = Zether.utils.fromHex(uHash);
        if ( !this._scope.chainData.zscNoncesMap[uHash] ){
            this._scope.chainData.pushArray( "zscListNonceSet", Buffer.from(uHash,'hex') );
            this._scope.chainData.zscNoncesMap[uHash] = true;
        }
    }

    async _clearNonceSet(){
        this._scope.chainData.zscListNonceSet = [];
        this._scope.chainData.zscNoncesMap = {};
        this._nonceSet = {};
    }

    _setLastGlobalUpdate(value){
        this._scope.chainData.zscLastGlobalUpdate = value;
    }

    _getLastGlobalUpdate(){
        return this._scope.chainData.zscLastGlobalUpdate;
    }

    _getEpoch(){
        return Math.floor( this._scope.chainData.end / 10);
    }

    getTimeLockEpoch(epoch){
        return epoch * 10;
    }

}