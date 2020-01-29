const {Helper, Exception, StringHelper, EnumHelper} = global.protocol.helpers;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

class CommonAccountTreeFunctions {

    static async getBalances( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.findRadixLeaf(publicKeyHash);

        const balances = out ? out.data.balances : undefined;

        if (balances){

            const result = {};
            for (const balance of balances)
                result[ balance.tokenCurrency.toString("hex") ] = balance.amount;

            return result;
        }

        //otherwise return undefined
    }

    static async getBalance( publicKeyHash, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id ){

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        if (!EnumHelper.validateEnum( tokenCurrency.toString("hex") , TransactionTokenCurrencyTypeEnum) ) throw new Exception(this, "Token Currency was not found");

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.findRadixLeaf(publicKeyHash);

        const balances = out ? out.data.balances : undefined;

        if (balances)
            for (const balance of balances)
                if (balance.tokenCurrency.equals( tokenCurrency ) )
                    return balance.amount;


        //otherwise return undefined
    }

    static async getNonce( publicKeyHash ){

        const out = await this.findRadixLeaf(publicKeyHash);
        return out ? out.data.nonce : undefined;

    }

    static async updateBalance( publicKeyHash, value, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id ){

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        if (!EnumHelper.validateEnum( tokenCurrency.toString("hex") , TransactionTokenCurrencyTypeEnum) ) throw new Exception(this, "Token Currency was not found");

        if (value === 0) throw new Exception(this, "Value is be different than 0");

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.findRadix(publicKeyHash);
        const node = out.result ? out.node : undefined;

        const balances = node ? node.data.balances : undefined;

        if (balances !== undefined ){

            for (let i=0; i < balances.length; i++) {

                const balance = balances[i];
                if (balance.tokenCurrency.equals(tokenCurrency)) {

                    const prevValue = balance.amount;

                    if (!this._scope.argv.transactions.coins.validateCoins(prevValue + value) ) throw new Exception(this, "Balance would become negative #1", );

                    const newAmount = prevValue + value;
                    balance.amount = newAmount;

                    node.__changes.data = true;
                    node.data.__changes.balances = true;

                    if (balance.isBalanceEmpty()) {

                        node.data.removeArray( "balances", i );

                        //IMPORTANT no need to delete balance as the balances are not saved separately
                        //await balance.delete();

                        if ( node.data.isDataEmpty() ){

                            await this.deleteRadix(publicKeyHash);
                            return 0;

                        }

                    }

                    await node.propagateHashChange(); //refresh hash
                    await this._saveNode(node);

                    return newAmount;

                }
            }

            //not found
            node.data.pushArray("balances", {
                tokenCurrency,
                amount: value,
            }, "object" );
            node.__changes.data = true;

            await node.propagateHashChange(); //refresh hash
            await this._saveNode(node);

            return node.data.balance;

        } else {

            if (!this._scope.argv.transactions.coins.validateCoins(value) ) throw new Exception(this, "Balance would become negative #2", {publicKeyHash, value } );

            await this.addRadix(publicKeyHash, {

                nonce: 0,
                balances: [{
                        tokenCurrency,
                        amount: value,
                    }
                ]

            } );

            return value;

        }

    }

    static async updateNonce( publicKeyHash, value){

        if (value === 0) throw new Exception(this, "Value needs to be different than 0");

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.findRadix(publicKeyHash);
        const node = out.result ? out.node : undefined;

        const prevValue = node ? node.data.nonce : undefined;

        if (prevValue !== undefined ){

            if (!this._scope.argv.transactions.coins.validateCoins(prevValue + value) ) throw new Exception(this, "Nonce would become illegal", );

            node.data.nonce = prevValue + value;
            node.__changes.data = true;

            if ( node.data.isDataEmpty() ){
                await this.deleteRadix(publicKeyHash);
                return 0;
            }

            await node.propagateHashChange(); //refresh hash
            await this._saveNode(node);

            return node.data.nonce;

        } else {

            throw new Exception(this, "Update nonce but account doesn't exist", {publicKeyHash, value });

        }
    }

}

export default  CommonAccountTreeFunctions;