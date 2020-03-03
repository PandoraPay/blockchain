import TokenHashMapElement from "./token-hash-map-element";

const {HashVirtualMap} = global.kernel.dataStructures.hashMap;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

/**
 * Required for consensus.
 * Stores tokens
 *
 */

export default class TokenHashVirtualMap extends HashVirtualMap {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "tokenMap",
                    fixedBytes: 8,
                },

                element: {
                    classObject: TokenHashMapElement,
                },

            },


        }, schema, false), data, type, creationOptions);

    }

}