const {ZetherDepositTransaction} = global.cryptography.transactions.simpleTransaction;
const {Helper, Exception} = global.kernel.helpers;
const Zether = global.cryptography.zether;

import BlockchainSimpleTransaction from "./../blockchain-simple-transaction"

export default class BlockchainZetherDepositSimpleTransaction extends ZetherDepositTransaction {

    constructor(scope, schema={}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                nonce: {

                    type: "number",
                    position: 10000,

                },

            }

        }, schema, false), data, type, creationOptions);

    }

    async validateTransactionOnce(chain = this._scope.chain, chainData = chain.data, block){
        return BlockchainSimpleTransaction.prototype.validateTransactionOnce.call(this, chain, chainData, block);
    }

    async preValidateTransaction(chain = this._scope.chain, chainData = chain.data, block){
        return BlockchainSimpleTransaction.prototype.preValidateTransaction.call(this, chain, chainData, block);
    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){
        return BlockchainSimpleTransaction.prototype.validateTransaction.call(this, chain, chainData, block);
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        if (await BlockchainSimpleTransaction.prototype.transactionAdded.call(this, chain, chainData, block, merkleHeight, merkleLeafHeight) !== true) return false;
        ;
        if (await super.transactionAddedToZether(chain, chainData) !== true) return false;

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

        const list = [];

        let nonceSet, lastGlobalUpdate;

        //used by rollover
        if (merkleLeafHeight === 0){

            nonceSet = chainData.zsc._getNonceSetAll();
            lastGlobalUpdate = chainData.zsc._getLastGlobalUpdate();

        } else {
            nonceSet = "skip";
            lastGlobalUpdate = "skip";
        }

        for (const voutZether of this.voutZether){

            const y =  Zether.bn128.unserializeFromBuffer( voutZether.zetherPublicKey);

            const yHash = Zether.utils.keccak256( Zether.utils.encodedPackaged( Zether.bn128.serialize( y ) ) );

            const pending = await chainData.zsc._getPending( yHash, true );
            const acc = await chainData.zsc._getAccMap( yHash, true );

            list.push({

                yHash,

                pending: {
                    data: pending,
                },

                acc: {

                    data: acc,
                },
            })
        }


        if (list.length !== this.voutZether.length) throw new Exception(this, "revertInfo length is not right");

        return {
            list,
            nonceSet,
            lastGlobalUpdate,
        };

    }

    async processTransactionRevertInfoPreviousState(revertInfoData, chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight ){

        if (revertInfoData.nonceSet !== "skip") chainData.zsc._setNonceSetAll(revertInfoData.nonceSet);
        if (revertInfoData.lastGlobalUpdate !== "skip") chainData.zsc._setLastGlobalUpdate(revertInfoData.lastGlobalUpdate);

        for (const revert of revertInfoData.list){

            if (revert.pending.data === null) await chainData.zsc._deletePending( revert.pending.yHash );
            else await chainData.zsc._setPending( revert.pending.yHash, revert.pending.data );

            if (!revert.acc.data) await chainData.zsc._deleteAccMap( revert.acc.yHash );
            else await chainData.zsc._setAccMap( revert.acc.yHash, revert.acc..data );

        }


    }

    _fieldsForSignature(){
        return {
            ...super._fieldsForSignature(),
            nonce: true,
        }
    }

    get getVinPublicKeyHash(){
        return this.vin.length ? this.vin[0].publicKeyHash : undefined;
    }


}

