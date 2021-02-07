const {SimpleTxModel} = require('cryptography').transactions.simpleTransaction;
const {Helper, Exception} = require('kernel').helpers;

const {ChainSimpleTxSchemaBuilt} = require('./chain-simple-tx-schema-build')

module.exports = class ChainSimpleTxModel extends SimpleTxModel {

    constructor(scope, schema= ChainSimpleTxSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    async validateTransactionOnce(chain = this._scope.chain, chainData = chain.data, block){

        for (const vin of this.vin)
            if ( !this._scope.argv.transactions.coins.validateCoins( vin.amount ) ) throw new Exception(this, "Vin is not good");

        for (const vout of this.vout)
            if ( !this._scope.argv.transactions.coins.validateCoins( vout.amount ) ) throw new Exception(this, "Vout is not good");

        if ( await this.verifyTransactionSignatures(chain) !== true) throw new Exception(this, "Signatures returned false");

        return true;
    }

    async preValidateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        /**
         * Check Hash
         */

        if (this.unlockTime && this.unlockTime < chainData.end)
            throw new Exception (this, "Unlock time is invalid");

        const hashExistence = await chainData.txInfoHashMap.getMap( this.hash().toString("hex"), );
        if (hashExistence ) throw new Exception (this, "Hash already found", {hash: this.hash().toString("hex") });

        return true;

    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){


        if ( await this.preValidateTransaction(chain, chainData, block) !== true) throw new Exception(this, "Validate Transaction is false", {   });

        /**
         * Check nonce and balances
         */

        if (this.getVinPublicKeyHash){
            const nonce = await chainData.accountHashMap.getNonce( this.vin[0].publicKeyHash ) || 0;
            if (nonce !== this.nonce) throw new Exception(this, "Nonce is invalid", {nonce, txNonce: this.nonce, publicKeyHash: this.vin[0].publicKeyHash });
        }

        for (let i=0; i < this.vin.length; i++){

            const vin = this.vin[i];

            const balance = await chainData.accountHashMap.getBalance( vin.publicKeyHash  ) || 0;

            if (balance < vin.amount) throw new Exception(this, "Not Enough Funds", { publicKeyHash: vin.publicKeyHash, balance, txAmount: vin.amount,  }, )

        }

        return true;

    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        /**
         * Store txId into TxHashMap
         */
        await chainData.txInfoHashMap.updateMap( this.hash().toString("hex"), {
            blockTimestamp: block.timestamp,
            blockHeight: block.height,
            merkleHeight,
            merkleLeafHeight,
        } );

        /**
         * Store Revert Info Previous State
         */
        const revertInfoPreviousState = await this.getTransactionRevertInfoPreviousState( chain, chainData, block, merkleHeight, merkleLeafHeight );
        if (revertInfoPreviousState)
            await chainData.txRevertInfoHashMap.updateMap( this.hash().toString("hex"), { data: JSON.stringify(revertInfoPreviousState) } );

        /**
         * Store TxId into AddressTxMap
         */

        const inputsOutputs = this.vin.concat(this.vout);

        for (const input of inputsOutputs) {

            const address = input.publicKeyHash.toString('hex');

            const addressHashMapOut = await chainData.addressHashMap.getMap( address );

            let txsCount = 0;
            if (addressHashMapOut)
                txsCount = addressHashMapOut.txsCount;

            await chainData.addressTxHashMap.updateMap(address+"_"+txsCount, {
                hash: this.hash(),
            } );

            await chainData.addressHashMap.updateMap(address, {
                txsCount: ++txsCount
            });

        }

        /**
         * Update nonce
         */
        await chainData.accountHashMap.updateNonce( this.vin[0].publicKeyHash, 1);

        /**
         * Update Senders' balances (-vin)
         */
        for (let i=0; i < this.vin.length; i++){

            const vin = this.vin[i];

            const balance = await chainData.accountHashMap.updateBalance( vin.publicKeyHash, -vin.amount, vin.tokenCurrency );

            if (balance < 0) throw new Exception(this, "Balance got negative", {publicKey: vin.publicKey, balance, txAmount: vin.amount, tokenCurrency: vin.tokenCurrency });
        }

        /**
         * Update Receivers' balances (+vout)
         */
        for (let i=0; i < this.vout.length; i++){

            const vout = this.vout[i];

            const balance = await chainData.accountHashMap.updateBalance( vout.publicKeyHash, vout.amount, vout.tokenCurrency );

        }

        return true;

    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight ){

        /**
         * Remove txId from HashMap
         */
        await chainData.txInfoHashMap.deleteMap( this.hash().toString("hex") );

        /**
         * Process Revert Info Previous State
         */
        const revertInfoPreviousState = await chainData.txRevertInfoHashMap.getMap( this.hash().toString("hex") );
        if (revertInfoPreviousState){
            await this.processTransactionRevertInfoPreviousState( JSON.parse(revertInfoPreviousState.data), chain, chainData, block, merkleHeight, merkleLeafHeight );
            await chainData.txRevertInfoHashMap.deleteMap( this.hash().toString("hex")  );
        }

        /**
         * Remove TxId into AddressTxMap
         */

        const addresses = this.vin.map( it => it.publicKeyHash.toString("hex") ).concat(  this.vout.map( it => it.publicKeyHash.toString("hex" ) ));

        for (const address of addresses) {

            const addressHashMapOut = await chainData.addressHashMap.getMap( address );

            let txsCount = 0;
            if (addressHashMapOut)
                txsCount = addressHashMapOut.txsCount;

            await chainData.addressTxHashMap.deleteMap(address + "_" + (txsCount-1) );

            if (txsCount > 1)
                await chainData.addressHashMap.updateMap(address, {
                    txsCount: --txsCount
                });
            else
                await chainData.addressHashMap.deleteMap( address );
        }

        /**
         * Update Receivers' balances ( -vout )
         */

        for (let i=this.vout.length-1; i >= 0; i--){

            const vout = this.vout[i];

            const balance = await chainData.accountHashMap.updateBalance( vout.publicKeyHash, -vout.amount, vout.tokenCurrency );

            if (balance < 0) throw new Exception(this, "Balance got negative when tx removed", {publicKey: vout.publicKey, balance, txAmount: vout.amount, tokenCurrency: vout.tokenCurrency });

        }

        /**
         * Update Senders' balances ( +vin )
         */

        for (let i=this.vin.length-1; i >= 0; i--){

            const vin = this.vin[i];

            const balance = await chainData.accountHashMap.updateBalance( vin.publicKeyHash, +vin.amount, vin.tokenCurrency );

        }

        /**
         * Update nonce
         */

        await chainData.accountHashMap.updateNonce( this.vin[0].publicKeyHash, -1);

        return true;

    }

    async getTransactionRevertInfoPreviousState(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){
        return undefined;
    }

    async processTransactionRevertInfoPreviousState(revertInfoData, chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight ){
    }

    async transactionSuccessfullyAdded(chain = this._scope.chain, chainData = chain.data, ){

    }

    async transactionSuccessfullyRemoved(chain = this._scope.chain, chainData = chain.data,){

    }

    calculateAddressesChanged(addresses){

        // for (let i=this.vout.length-1; i >= 0; i--)
        //     const vout = this.vout[i];

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

