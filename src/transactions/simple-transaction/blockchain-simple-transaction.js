const {SimpleTransaction} = global.cryptography.transactions.simpleTransaction;
const {Helper, Exception} = global.kernel.helpers;

export default class BlockainSimpleTransaction extends SimpleTransaction {

    async validateTransactionInfo(chain = this._scope.chain, chainData = chain.data, block){

        for (const vin of this.vin)
            if ( !this._scope.argv.transactions.coins.validateCoins( vin.amount ) ) throw new Exception(this, "Vin is not good");

        for (const vout of this.vout)
            if ( !this._scope.argv.transactions.coins.validateCoins( vout.amount ) ) throw new Exception(this, "Vout is not good");


        /**
         * Check Hash
         */
        const hashExistence = await chainData.txHashMap.getMap( this.hash().toString("hex"), );
        if (hashExistence ) throw new Exception (this, "Hash already found", {hash: this.hash().toString("hex") });

        return true;
    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){


        if ( await this.validateTransactionInfo(chain, chainData, block) !== true) throw new Exception(this, "Validate Transaction is false", {   });

        /**
         * Check nonce and balances
         */
        const nonce = await chainData.accountTree.getNonce( this.vin[0].publicKeyHash ) || 0;

        if (nonce !== this.nonce) throw new Exception(this, "Nonce is invalid", {nonce, txNonce: this.nonce });

        for (let i=0; i < this.vin.length; i++){

            const vin = this.vin[i];

            const balance = await chainData.accountTree.getBalance( vin.publicKeyHash  ) || 0;

            if (balance < vin.amount) throw new Exception(this, "Not Enough Funds", { publicKey: vin.publicKey, balance, txAmount: vin.amount }, )

        }

        return true;

    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        /**
         * Store txId into TxHashMap
         */
        await chainData.txHashMap.updateMap( this.hash().toString("hex"), {
            blockTimestamp: block.timestamp,
            blockHeight: block.height,
            merkleHeight,
            merkleLeafHeight,
        } );

        /**
         * Store TxId into AddressTxMap
         */

        const addresses = this.vin.map( it => it.publicKeyHash.toString("hex") ).concat(  this.vout.map( it => it.publicKeyHash.toString("hex" ) ));

        for (const address of addresses) {

            const addressHashMapOut = await chainData.addressHashMap.getMap( address );

            let txsCount = 0;
            if (addressHashMapOut)
                txsCount = addressHashMapOut.data.txsCount;

            await chainData.addressTxHashMap.updateMap(address+"_"+txsCount, this.hash() );

            await chainData.addressHashMap.updateMap(address, {
                txsCount: ++txsCount
            });

        }

        /**
         * Update nonce
         */
        await chainData.accountTree.updateNonce( this.vin[0].publicKeyHash, 1);

        /**
         * Update Senders' balances (-vin)
         */
        for (let i=0; i < this.vin.length; i++){

            const vin = this.vin[i];

            const balance = await chainData.accountTree.updateBalance( vin.publicKeyHash, -vin.amount );

            if (balance < 0) throw new Exception(this, "Balance got negative", {publicKey: vin.publicKey, balance, txAmount: vin.amount });
        }

        /**
         * Update Receivers' balances (+vout)
         */
        for (let i=0; i < this.vout.length; i++){

            const vout = this.vout[i];

            const balance = await chainData.accountTree.updateBalance( vout.publicKeyHash, vout.amount );

        }

        return true;

    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data,){

        /**
         * Remove txId from HashMap
         */
        await chainData.txHashMap.deleteMap( this.hash().toString("hex") );

        /**
         * Remove TxId into AddressTxMap
         */

        const addresses = this.vin.map( it => it.publicKeyHash.toString("hex") ).concat(  this.vout.map( it => it.publicKeyHash.toString("hex" ) ));

        for (const address of addresses) {

            const addressHashMapOut = await chainData.addressHashMap.getMap( address );

            let txsCount = 0;
            if (addressHashMapOut)
                txsCount = addressHashMapOut.data.txsCount;

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

            const balance = await chainData.accountTree.updateBalance( vout.publicKeyHash, -vout.amount );

            if (balance < 0) throw new Exception(this, "Balance got negative when tx removed", {publicKey: vout.publicKey, balance, txAmount: vout.amount });

        }

        /**
         * Update Senders' balances ( +vin )
         */

        for (let i=this.vin.length-1; i >= 0; i--){

            const vin = this.vin[i];

            const balance = await chainData.accountTree.updateBalance( vin.publicKeyHash, +vin.amount );

        }

        /**
         * Update nonce
         */

        await chainData.accountTree.updateNonce( this.vin[0].publicKeyHash, -1);

        return true;

    }


    async transactionSuccessfullyAdded(chain = this._scope.chain, chainData = chain.data, ){

    }

    async transactionSuccessfullyRemoved(chain = this._scope.chain, chainData = chain.data,){

    }


    calculateAddressesChanged(addresses){

        for (let i=this.vout.length-1; i >= 0; i--) {

            const vout = this.vout[i];

        }

    }

}

