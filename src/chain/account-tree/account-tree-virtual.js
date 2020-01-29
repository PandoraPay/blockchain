const {RadixTreeVirtual} = global.protocol.dataStructures.radixTree;
const {Helper, Exception} = global.protocol.helpers;

import AccountTreeRoot from "./account-tree-root";
import CommonAccountTreeFunctions from "./common-account-tree-functions";

export default class AccountTreeVirtual extends RadixTreeVirtual {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "accTree",
                    fixedBytes: 7,
                },

                root: {
                    classObject: AccountTreeRoot,
                },

            },

        }, schema, false), data, type, creationOptions);

    }

    async getBalances(){
        return CommonAccountTreeFunctions.getBalances.apply(this, arguments);
    }

    async getBalance(){
        return CommonAccountTreeFunctions.getBalance.apply(this, arguments);
    }

    async getNonce(){
        return CommonAccountTreeFunctions.getNonce.apply(this, arguments);
    }

    async updateBalance(){
        return CommonAccountTreeFunctions.updateBalance.apply(this, arguments);
    }

    async updateNonce(){
        return CommonAccountTreeFunctions.updateNonce.apply(this, arguments);
    }

}