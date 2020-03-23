const {ZetherDepositTransaction} = global.cryptography.transactions.simpleTransaction;
const {Helper, Exception} = global.kernel.helpers;
const Zether = global.cryptography.zether;

import BlockchainSimpleTransaction from "./../blockchain-simple-transaction"

export default class BlockchainZetherDepositTransaction extends ZetherDepositTransaction {

    async validateTransactionInfo(chain = this._scope.chain, chainData = chain.data, block){
        return BlockchainSimpleTransaction.prototype.validateTransactionInfo.call(this, chain, chainData, block);
    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){
        return BlockchainSimpleTransaction.prototype.validateTransaction.call(this, chain, chainData, block);
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        const out = await BlockchainSimpleTransaction.prototype.transactionAdded.call(this, chain, chainData, block, merkleHeight, merkleLeafHeight);
        if (!out) return false;

        const outAddZether = await super.transactionAddedToZether(chain, chainData);
        if (!outAddZether) return false;

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){
        return BlockchainSimpleTransaction.prototype.transactionRemoved.call(this, chain, chainData, block, merkleHeight, merkleLeafHeight);
    }

    async transactionSuccessfullyAdded(chain = this._scope.chain, chainData = chain.data, ){
        return BlockchainSimpleTransaction.prototype.transactionSuccessfullyAdded.call(this, chain, chainData);
    }

    async transactionSuccessfullyRemoved(chain = this._scope.chain, chainData = chain.data,){
        return BlockchainSimpleTransaction.prototype.transactionSuccessfullyRemoved.call(this, chain, chainData);
    }

    async getTransactionRevertInfoPreviousState(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        const y =  Zether.bn128.unserializeFromBuffer(this.vout[0].zetherPublicKey);

        const yHash = Zether.utils.keccak256( Zether.utils.encodedPackaged( Zether.bn128.serialize( y ) ) );
        const pending = await chainData.ZSC._getPending( yHash );
        const acc = await chainData.ZSC._getAccMap( yHash );

        let nonceSet, lastGlobalUpdate;

        //used by rollover
        if (merkleLeafHeight === 0){

            nonceSet = chainData.ZSC._getNonceSetAll();
            lastGlobalUpdate = chainData.ZSC._getLastGlobalUpdate();

        } else {
            nonceSet = "skip";
            lastGlobalUpdate = "skip";
        }


        return {

            pending: {
                yHash,
                point0: pending ? pending.data.point0 : undefined,
                point1: pending ? pending.data.point1 : undefined,
            },

            acc: {
                yHash,
                point0: pending ? acc.data.point0 : undefined,
                point1: pending ? acc.data.point1 : undefined,
            },

            nonceSet,
            lastGlobalUpdate,
        };


    }

    async processTransactionRevertInfoPreviousState(revertInfoData, chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight ){

        if (revertInfoData.nonceSet !== "skip") chainData.ZSC._setNonceSetAll(revertInfoData.nonceSet);
        if (revertInfoData.lastGlobalUpdate !== "skip") chainData.ZSC._setLastGlobalUpdate(revertInfoData.lastGlobalUpdate);

        if (!revertInfoData.pending.point0) await chainData.ZSC._deletePending( revertInfoData.pending.yHash );
        else await chainData.ZSC._setPending( revertInfoData.pending.yHash, [ revertInfoData.pending.point0, revertInfoData.pending.point1 ] );

        if (!revertInfoData.acc.point0) await chainData.ZSC._deleteAccMap( revertInfoData.acc.yHash );
        else await chainData.ZSC._setAccMap( revertInfoData.acc.yHash, [ revertInfoData.acc.point0, revertInfoData.acc.point1 ] );

    }


}

