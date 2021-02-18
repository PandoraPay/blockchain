const {HashVirtualMapModel} = PandoraLibrary.dataStructures.hashMap;
const {TxTokenCurrencyTypeEnum} = PandoraLibrary.transactions;
const {Helper, Exception, StringHelper, EnumHelper} = PandoraLibrary.helpers;

const {AccountHashMapElementSchemaBuilt} = require( "./element/account-hash-map-element-schema-build")
const AccountHashMapElementModel = require('./element/account-hash-map-element-model')

/**
 * Required for consensus.
 * Stores accounts, like balances, delegate
 */

module.exports = class AccountHashVirtualMapModel extends HashVirtualMapModel {

    constructor(scope, schema, data, type, creationOptions) {
        super(scope, schema, data, type, creationOptions);
        this._childHashMapModel = AccountHashMapElementModel;
        this._childHashMapSchemaBuilt = AccountHashMapElementSchemaBuilt;
    }

    processLeafLabel(label){

        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length === 0) throw new Exception(this, "label length is invalid");

        if (label.length !== 40) throw Error("label is not leaf");

        return label;
    }

    async getAccountNode(publicKeyHash ){
        publicKeyHash = this.processLeafLabel(publicKeyHash);
        return this.getMap(publicKeyHash);
    }

    async getBalances( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.getMap(publicKeyHash);

        const balances = out ? out.balances : undefined;

        if (balances){

            const result = {};
            for (const balance of balances)
                result[ balance.tokenCurrency.toString("hex") ] = balance.amount;

            return result;
        }

        //otherwise return undefined
    }

    async getBalance( publicKeyHash, tokenCurrency = TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer ){

        if (typeof tokenCurrency === "string" && ( StringHelper.isHex(tokenCurrency) || !tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        await this._scope.chainData.tokenHashMap.currencyExists(tokenCurrency);

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.getMap(publicKeyHash);

        const balances = out ? out.balances : undefined;

        if (balances)
            for (const balance of balances)
                if (balance.tokenCurrency.equals( tokenCurrency ) )
                    return balance.amount;


        //otherwise return undefined2
    }

    async getNonce( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.getMap(publicKeyHash);
        return out ? out.nonce : undefined;

    }

    async getDelegate( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.getMap(publicKeyHash);
        return out ? out.delegate : undefined;

    }

    async updateBalance( publicKeyHash, value, tokenCurrency = TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer ){

        if (typeof tokenCurrency === "string" && ( StringHelper.isHex(tokenCurrency) || !tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        await this._scope.chainData.tokenHashMap.currencyExists(tokenCurrency);

        if (value === 0) throw new Exception(this, "Value is be different than 0");

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const node = await this.getMap(publicKeyHash);

        const balances = node ? node.balances : undefined;

        if (balances !== undefined ){

            for (let i=0; i < balances.length; i++) {

                const balance = balances[i];
                if (balance.tokenCurrency.equals(tokenCurrency)) {

                    const prevValue = balance.amount;

                    if (!this._scope.argv.transactions.coins.validateCoins(prevValue + value) ) throw new Exception(this, "Balance would become negative #1", );

                    const newAmount = prevValue + value;
                    balance.amount = newAmount;

                    if (balance.isBalanceEmpty()) {

                        node.removeArray( "balances", i );

                        //IMPORTANT no need to delete balance as the balances are not saved separately
                        //await balance.delete();

                        if ( node.isDataEmpty() ){

                            await this.deleteMap(publicKeyHash);
                            return 0;

                        }

                    }

                    await this.updateMap(publicKeyHash, node );

                    return newAmount;

                }
            }

            //not found
            node.pushArray("balances", {
                tokenCurrency,
                amount: value,
            }, "object" );

            await this.updateMap(publicKeyHash, node );

            return node.balance;

        } else {

            if (!this._scope.argv.transactions.coins.validateCoins(value) ) throw new Exception(this, "Balance would become negative #2", {publicKeyHash: publicKeyHash, value } );

            await this.updateMap(publicKeyHash, {

                nonce: 0,
                balances: [{
                    tokenCurrency,
                    amount: value,
                }]

            } );

            return value;

        }

    }

    async updateNonce( publicKeyHash, value){

        if (value === 0) throw new Exception(this, "Value needs to be different than 0");
        if (value > 1 || value < -1) throw new Exception(this, "Value is bigger than 1 or less than -1");
        if (typeof value !== "number" ) throw new Exception(this, "invalid value");

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const node = await this.getMap(publicKeyHash);

        const prevValue = node ? node.nonce : undefined;

        if (prevValue !== undefined ){

            if (!this._scope.argv.transactions.coins.validateCoins(prevValue + value) ) throw new Exception(this, "Nonce would become illegal", );

            node.nonce = prevValue + value;

            if ( node.isDataEmpty() ){
                await this.deleteMap(publicKeyHash);
                return 0;
            }

            await this.updateMap(publicKeyHash, node );

            return node.nonce;

        } else
            throw new Exception(this, "updateNonce error - account doesn't exist", {publicKeyHash: publicKeyHash, value });

    }

    async updateDelegate( publicKeyHash, delegateStakeNonceUpdate, delegateStakePublicKey, delegateStakeFee ){

        if (!Buffer.isBuffer(delegateStakePublicKey) && StringHelper.isHex(delegateStakePublicKey) ) delegateStakePublicKey = Buffer.from(delegateStakePublicKey, "hex");

        if (delegateStakeNonceUpdate > 1 || delegateStakeNonceUpdate < -1) throw new Exception(this, "Value is bigger than 1 or less than -1", {delegateStakeNonceUpdate});
        if (delegateStakeFee > this._scope.argv.transactions.staking.delegateStakingFeePercentage ) throw new Exception(this, "delegateStakeFee is larger than percentage fee ", {delegateStakeFee});

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const node = await this.getMap(publicKeyHash);

        if (node){

            node.delegateVersion = 1;
            node.delegate.delegateStakeNonce = node.delegate.delegateStakeNonce + delegateStakeNonceUpdate;
            node.delegate.delegateStakePublicKey = delegateStakePublicKey;
            node.delegate.delegateStakeFee = delegateStakeFee;

            if ( node.isDataEmpty() ){
                await this.deleteMap(publicKeyHash);
                return node.delegate;
            }

            await this.updateMap(publicKeyHash, node );

            return node.delegate;

        } else {

            throw new Exception(this, "updateDelegate error - account doesn't exist", {publicKeyHash: publicKeyHash, delegateStakeNonceUpdate, delegateStakePublicKey, delegateStakeFee });

        }
    }


}

