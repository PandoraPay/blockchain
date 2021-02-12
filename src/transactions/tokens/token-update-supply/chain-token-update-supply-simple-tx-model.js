const {Helper, Exception} = require('kernel').helpers;

const ChainSimpleTxModel = require( "../../simple-transaction/chain-simple-tx-model");
const {ChainTokenUpdateSupplySimpleTxSchemaBuilt} = require('./chain-token-update-supply-simple-tx-schema-build')

module.exports = class ChainTokenUpdateSupplySimpleTxModel extends ChainSimpleTxModel {

    constructor(scope, schema= ChainTokenUpdateSupplySimpleTxSchemaBuilt, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        const out = await super.validateTransaction(chain, chainData, block);
        if (!out) return false;

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );

        const token = await chainData.tokenHashMap.getTokenNode( this.tokenUpdateData.tokenPublicKeyHash );
        if (!token) throw new Exception(this, `Token doesn't exist`);

        if (token.verificationPublicKeyHash.equals(this._scope.argv.blockchain.genesis.BURN_PUBLIC_KEY_HASH))
            throw new Exception(this, 'verificationPublicKeyHash is invalid');

        if (!token.verificationPublicKeyHash.equals(this.vin[0].publicKeyHash)) //validate the printer public key hash
            throw new Exception(this, 'verificationPublicKeyHash is not matching');

        if (this.supplySignValue < 0 && !token.canBurn ) throw new Exception(this, "supply can not be burned");
        if (this.supplySignValue > 0 && !token.canMint ) throw new Exception(this, "supply can not be minted");

        const newSupply = token.data.supply + this.supplySignValue * this.tokenUpdateData.supplyValue;
        if ( newSupply > token.data.maxSupply || newSupply < 0 ) throw new Exception(this, "New Supply exceeded max supply", {newSupply });

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        const newSupply = await chainData.tokenHashMap.updateTokenSupply( this.tokenUpdateData.tokenPublicKeyHash, this.supplySignValue * this.tokenUpdateData.supplyValue );
        if (newSupply < 0) throw new Exception(this, "New Supply got negative", {newSupply });

        const balance = await chainData.accountHashMap.updateBalance( this.vin[0].publicKeyHash, this.supplySignValue * this.tokenUpdateData.supplyValue, this.tokenUpdateData.tokenPublicKeyHash );
        if (balance < 0) throw new Exception(this, 'balance got negative', {balance});

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        const balance = await chainData.accountHashMap.updateBalance( this.vin[0].publicKeyHash, (-this.supplySignValue) * this.tokenUpdateData.supplyValue, this.tokenUpdateData.tokenPublicKeyHash );
        if (balance < 0) throw new Exception(this, 'balance got negative', {balance});

        const newSupply = await chainData.tokenHashMap.updateTokenSupply( this.tokenUpdateData.tokenPublicKeyHash, (-this.supplySignValue) * this.supplyValue );
        if (newSupply < 0) throw new Exception(this, "New Supply got negative", {newSupply });

        return super.transactionRemoved(chain, chainData);

    }

    get supplySignValue(){
        return this.tokenUpdateData.supplySign ? 1 : - 1;
    }

}