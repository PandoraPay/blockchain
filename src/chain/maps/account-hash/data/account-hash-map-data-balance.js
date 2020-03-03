const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, EnumHelper} = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

export default class AccountHashMapDataBalance extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge({

            fields: {


                version: {
                    type: "number",
                    fixedBytes: 1,

                    default: 0,

                    validation(version){
                        return version === 0;
                    },
                    
                    position: 100,
                },

                tokenCurrency:{
                    type: "buffer",
                    minSize: 1,
                    maxSize: 32,

                    default: TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer,

                    validation(value){

                        const tokenCurrencyString = value.toString("hex");
                        return EnumHelper.validateEnum(tokenCurrencyString, TransactionTokenCurrencyTypeEnum );

                    },

                    position: 101,

                },

                amount: {
                    type: "number",
                    position: 102,
                },

            },

            options: {
                hashing: {

                    enabled: true,
                    parentHashingPropagation: true,

                    fct: b => b,

                },
            },

            saving:{
                storeDataNotId: true,
            },


        }, schema, false), data, type, creationOptions);

    }

    isBalanceEmpty(){

        if (this.amount === 0 ) return true;
        return false;
    }

}
