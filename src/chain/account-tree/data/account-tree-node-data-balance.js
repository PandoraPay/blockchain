const {DBSchema} = global.protocol.marshal.db;
const {Helper, Exception, EnumHelper} = global.protocol.helpers;
const {CryptoHelper} = global.protocol.helpers.crypto;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

export default class AccountTreeNodeDataBalance extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge({

            fields: {


                version: {
                    type: "number",
                    fixedBytes: 1,

                    default: 0,

                    validate(version){
                        return version === 0;
                    },
                    
                    position: 100,
                },

                tokenCurrency:{
                    type: "buffer",
                    minSize: 1,
                    maxSize: 32,

                    default: Buffer.from( TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id, "hex"),

                    validation(value){

                        let tokenCurrencyString = value.toString("hex");
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
