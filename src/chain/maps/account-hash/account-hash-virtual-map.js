const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

import AddressHashMapElement from "./account-hash-map-element"

/**
 * Required for consensus. Used only for explorer
 * Stores info related to a Transaction
 *
 * info like: TransactionsCount associated with an address
 *
 */

export default class AccountHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "accountMap",
                    fixedBytes: 10,
                },

                element: {
                    classObject: AddressHashMapElement,
                },

            },


        }, schema, false), data, type, creationOptions);

    }

    processLeafLabel(label){

        if (Buffer.isBuffer(label)) label = label.toString("hex");
        if (typeof label !== "string" || label.length === 0) throw new Exception(this, "label length is invalid");

        if (label.length !== 40) throw "label is not leaf";

        return label;
    }

    async getBalances( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);
        const out = await this.getMap(publicKeyHash);

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
        const out = await this.getMap(publicKeyHash);

        const balances = out ? out.data.balances : undefined;

        if (balances)
            for (const balance of balances)
                if (balance.tokenCurrency.equals( tokenCurrency ) )
                    return balance.amount;


        //otherwise return undefined2
    }

    async getNonce( publicKeyHash ){

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const out = await this.getMap(publicKeyHash);

        return out ? out.data.nonce : undefined;

    }

    async updateBalance( publicKeyHash, value, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id ){

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        if (!EnumHelper.validateEnum( tokenCurrency.toString("hex") , TransactionTokenCurrencyTypeEnum) ) throw new Exception(this, "Token Currency was not found");

        if (value === 0) throw new Exception(this, "Value is be different than 0");

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const node = await this.getMap(publicKeyHash);

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

                            await this.deleteMap(publicKeyHash);
                            return 0;

                        }

                    }

                    await this.updateMap(publicKeyHash, node.data );

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

            await this.updateMap(publicKeyHash, node.data );

            return node.data.balance;

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

        publicKeyHash = this.processLeafLabel(publicKeyHash);

        const node = await this.getMap(publicKeyHash);

        const prevValue = node ? node.data.nonce : undefined;

        if (prevValue !== undefined ){

            if (!this._scope.argv.transactions.coins.validateCoins(prevValue + value) ) throw new Exception(this, "Nonce would become illegal", );

            node.data.nonce = prevValue + value;
            node.__changes.data = true;

            if ( node.data.isDataEmpty() ){
                await this.deleteMap(publicKeyHash);
                return 0;
            }

            await this.updateMap(publicKeyHash, node.data );

            return node.data.nonce;

        } else {

            throw new Exception(this, "Update nonce but account doesn't exist", {publicKeyHash: publicKeyHash, value });

        }
    }


}
