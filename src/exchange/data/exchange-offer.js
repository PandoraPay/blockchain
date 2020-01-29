const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, EnumHelper } = global.kernel.helpers;
const {CryptoHelper} = global.kernel.helpers.crypto;

import ExchangeOfferPayment from "./exchange-offer-payment"
import ExchangeOfferTypeEnum from "./exchange-offer-type-enum"

export default class ExchangeOffer extends DBSchema {

    constructor(scope, schema, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                id:{
                    fixedBytes: 64, //publicKeyHash
                },

                table:{
                    default: "exOffer",
                    fixedBytes: 7,
                },

                version:{
                    type: "number",
                    fixedBytes: 1,
                    default: 0,

                    position: 100,
                },

                type: {
                    type: "number",

                    validation(type){
                        return EnumHelper.validateEnum( type , ExchangeOfferTypeEnum);
                    },

                    position: 101,
                },

                publicKey:{
                    type: "buffer",
                    fixedBytes: 33,

                    preprocessor(publicKey){
                        this._publicKeyHash = undefined;
                        this._address = undefined;
                        return publicKey;
                    },

                    position: 102,
                },

                height: {
                    type: "number",

                    position: 104,
                },

                title:{
                    type: "string",
                    minSize: 10,
                    maxSize: 255,

                    position: 105,
                },

                description: {
                    type: "string",
                    minSize: 10,
                    maxSize: 2000,

                    position: 106,
                },

                amountMin:{
                    type: "number",

                    position: 107,
                },

                amountMax:{
                    type: "number",

                    validation(amountMax){
                        return (amountMax >= this.amountMin) && amountMax > 0;
                    },

                    position: 108,
                },

                tokenCurrency:{
                    type: "buffer",
                    minSize: 1,
                    maxSize: 32,

                    position:109,
                },

                price:{
                    type: "number",

                    position: 110,
                },

                //leaf index
                payments:{
                    type: "array",
                    classObject: ExchangeOfferPayment,
                    minSize: 1,
                    maxSize: 255,

                    position: 111,
                },

                signature: {
                    type: "buffer",
                    fixedBytes: 65,
                    position: 199,
                },

            },

            options: {
                hashing: {
                    enabled: true,
                    fct: CryptoHelper.dkeccak256,
                }
            },

        }, schema, false), data, type, creationOptions);

    }

    get publicKeyHash(){

        if (!this._publicKeyHash)
            this._publicKeyHash = this._scope.cryptography.addressGenerator.generatePublicKeyHash( this.publicKey );

        return this._publicKeyHash;

    }

    get address(){

        if (!this._address)
            this._address = this._scope.cryptography.addressGenerator.generateAddressFromPublicKey( this.publicKey ).calculateAddress();

        return this._address;
    }

    prefixBufferForSignature(){

        //const hash
        const buffer = this.toBuffer( undefined, {

            onlyFields:{
                version: true,
                type: true,
                publicKey: true,
                epoch: true,
                title: true,
                description: true,
                amountMin: true,
                amountMax: true,
                tokenCurrency: true,
                price: true,
                payments: true,

            }

        } );

        return buffer;

    }

    signOffer(privateKey){

        const buffer = this.prefixBufferForSignature();

        const out = this._scope.cryptography.cryptoSignature.sign( buffer, privateKey );
        if (!out) throw new Exception(this, "Signature invalid", this.toJSON() );

        this.signature = out;
        return out;
    }

    verifyOffer(){

        const buffer = this.prefixBufferForSignature();

        const out = this._scope.cryptography.cryptoSignature.verify( buffer, this.signature, this.publicKey );
        if (!out) throw new Exception(this, "Signature invalid", this.toJSON() );

        return true;
    }

}