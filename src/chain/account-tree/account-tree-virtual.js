const {RadixTreeVirtual} = global.kernel.dataStructures.radixTree;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

import AccountTreeRoot from "./account-tree-root";

export default class AccountTreeVirtual extends RadixTreeVirtual {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                id: {
                    default: "accTree",
                    fixedBytes: 7,
                },

                root: {
                    classObject: AccountTreeRoot,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

    async getBalances( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.findRadixLeaf(publicKeyHash);

        if (out && !out.data)
            this._scope.logger.warn(this, "Strange error, node.data doesn't exist", {publicKeyHash: publicKeyHash.toString("hex"), node: out, id: out.id});

        const balances = out ? out.data.balances : undefined;

        if (balances){

            const result = {};
            for (const balance of balances)
                result[ balance.tokenCurrency.toString("hex") ] = balance.amount;

            return result;
        }

        //otherwise return undefined
    }

    async getBalance( publicKeyHash, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id ){

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        if (!EnumHelper.validateEnum( tokenCurrency.toString("hex") , TransactionTokenCurrencyTypeEnum) ) throw new Exception(this, "Token Currency was not found");

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.findRadixLeaf(publicKeyHash);

        if (out && !out.data)
            this._scope.logger.warn(this, "Strange error, node.data doesn't exist", {publicKeyHash: publicKeyHash.toString("hex"), node: out, id: out.id});

        const balances = out ? out.data.balances : undefined;

        if (balances)
            for (const balance of balances)
                if (balance.tokenCurrency.equals( tokenCurrency ) )
                    return balance.amount;


        //otherwise return undefined2
    }

    async getNonce( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.findRadixLeaf(publicKeyHash);
        if (out && !out.data)
            this._scope.logger.warn(this, "Strange error, node.data doesn't exist", {publicKeyHash: publicKeyHash.toString("hex"), node, id: node.id});

        return out ? out.data.nonce : undefined;

    }

    async updateBalance( publicKeyHash, value, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id ){

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        if (!EnumHelper.validateEnum( tokenCurrency.toString("hex") , TransactionTokenCurrencyTypeEnum) ) throw new Exception(this, "Token Currency was not found");

        if (value === 0) throw new Exception(this, "Value is be different than 0");

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.findRadix(publicKeyHash);
        const node = out.result ? out.node : undefined;

        if (node && !node.data)
            this._scope.logger.warn(this, "Strange error, node.data doesn't exist", {publicKeyHash: publicKeyHash.toString("hex"), node, id: node.id});

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
            node.data.__changes.balances = true;

            await node.propagateHashChange(); //refresh hash
            await this._saveNode(node);

            return node.data.balance;

        } else {

            if (!this._scope.argv.transactions.coins.validateCoins(value) ) throw new Exception(this, "Balance would become negative #2", {publicKeyHash: publicKeyHash.toString("hex"), value } );

            await this.addRadix(publicKeyHash, {

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

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.findRadix(publicKeyHash);
        const node = out.result ? out.node : undefined;

        if (node && !node.data)
            this._scope.logger.warn(this, "Strange error, node.data doesn't exist", {publicKeyHash: publicKeyHash.toString("hex"), node, id: node.id});


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

            throw new Exception(this, "Update nonce but account doesn't exist", {publicKeyHash: publicKeyHash.toString("hex"), value });

        }
    }


}