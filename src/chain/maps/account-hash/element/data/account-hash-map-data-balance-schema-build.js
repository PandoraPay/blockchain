const {DBSchemaBuild} = require('kernel').db;
const {Helper, Exception, EnumHelper} = require('kernel').helpers;
const {TxTokenCurrencyTypeEnum} = require('cryptography').transactions;

class AccountHashMapDataBalanceSchemaBuild extends DBSchemaBuild {

    constructor(schema){

        super(Helper.merge({

            fields: {


                version: {
                    type: "number",

                    default: 0,

                    validation(version){
                        return version === 0;
                    },
                    
                    position: 100,
                },

                tokenCurrency:{
                    type: "buffer",
                    maxSize: 20,
                    minSize: 0,
                    specifyLength: true,

                    default: TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer,

                    validation(value) {
                        return value.equals( TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer ) || (value.length === 20);
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

        }, schema, true ));

    }

}


module.exports = {
    AccountHashMapDataBalanceSchemaBuild,
    AccountHashMapDataBalanceSchemaBuilt: new AccountHashMapDataBalanceSchemaBuild(),
}