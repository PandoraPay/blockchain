const {ZetherDepositTransaction} = global.cryptography.transactions.simpleTransaction;
const {Helper, Exception} = global.kernel.helpers;

import BlockchainSimpleTransaction from "./../blockchain-simple-transaction"

export default class ZetherDepositTransaction extends ZetherDepositTransaction {

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

    async getTransactionRevertInfoPreviousState(chain = this._scope.chain, chainData = chain.data){

        const y =  Zether.bn128.unserializeFromBuffer(this.vout[0].zetherPublicKey);

        if (this.registration.registered === 1){

            const yHash = Zether.utils.keccak256( Zether.utils.encodedPackaged( Zether.bn128.serialize( y ) ) );
            const out = await chainData.zetherPendingHashMap.getMap( yHash );

            if ( await chainData.zsc.registered(yHash) === false )
                await chainData.zsc.register( y, Zether.utils.BNFieldfromHex( this.registration.c), Zether.utils.BNFieldfromHex( this.registration.s ) );
            else
                throw new Exception(this, "Account already registered");
        }

    }

    async processTransactionRevertInfoPreviousState(chain = this._scope.chain, chainData = chain.data, revertInfoData){
    }


}

