const {Exception, StringHelper, BufferHelper, EnumHelper} = global.kernel.helpers;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;
const {MarshalFields} = global.kernel.marshal;

export default class WalletTransfer {

    constructor(scope){
        this._scope = scope;
    }

    get wallet(){
        return this._scope.wallet;
    }

    async findWalletAddressThatIsGreaterThanAmount( amount, token, password){

        this.wallet.encryption.decryptWallet(password);

        for (const walletAddress of this.wallet.addresses){
            const publicKeyHash = walletAddress.decryptPublicKeyHash();
            const balance = await this._scope.mainChain.data.accountHashMap.getBalance(publicKeyHash, token);

            if (balance && balance >= amount)
                return walletAddress;
        }

    }


    async transferSimple( { address, txDsts, fee, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id, nonce, memPoolValidateTxData, paymentId, password, networkByte} ){

        if ( typeof tokenCurrency === "string" && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        await this._scope.mainChain.data.tokenHashMap.currencyExists(tokenCurrency);

        const requiredFunds = this._calculateRequiredFunds(txDsts);

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance( walletAddress.decryptPublicKeyHash(), tokenCurrency );
        if (!foundFunds) throw new Exception(this, "Not enough funds");

        const memPoolPending = this._scope.memPool.getMemPoolPendingBalance( walletAddress.decryptPublicAddress(networkByte), tokenCurrency )[ tokenCurrency.toString("hex") ] || 0;

        //calculate fee
        if (fee === undefined){
            fee = 0;
            //TODO CALCULATE FEE
        }

        if (requiredFunds === 0) throw new Exception(this, "Amount needs to be positive");

        if (foundFunds + memPoolPending < requiredFunds + fee  ) throw new Exception(this, "Not enough funds", { foundFunds, memPoolPending, requiredFunds, fee });

        const outs = this._processDstsAddresses(txDsts);

        const txOut =  await this._scope.mainChain.transactionsCreator.createSimpleTransaction( {
            vin: [{
                publicKey: walletAddress.decryptPublicKey(),
                amount: requiredFunds + fee,
            }],
            vout: outs,
            privateKeys: [ {
                privateKey: walletAddress.decryptPrivateKey()
            } ],
            nonce,
            tokenCurrency,
        } );

        await this._scope.memPool.newTransaction(txOut.tx, true, memPoolValidateTxData);

        return txOut;

    }


    async changeDelegate({address, fee, nonce, delegateOld, delegate, memPoolValidateTxData, paymentId, password, networkByte }){

        const tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer;

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        if (delegateOld && typeof delegateOld.delegatePublicKey === "string" && StringHelper.isHex(delegateOld.delegatePublicKey) )
            delegateOld.delegatePublicKey = MarshalFields.marshal_buffer_toBuffer( Buffer.from( delegateOld.delegatePublicKey, "hex"), {
                removeLeadingZeros: true,
                fixedBytes: 33,
            }, "delegatePublicKey", ()=>{}, "object", {}  );

        if (delegate && typeof delegate.delegatePublicKey === "string" && StringHelper.isHex(delegate.delegatePublicKey) )
            delegate.delegatePublicKey = MarshalFields.marshal_buffer_toBuffer( Buffer.from( delegate.delegatePublicKey, "hex"), {
                removeLeadingZeros: true,
                fixedBytes: 33,
            }, "delegatePublicKey", ()=>{}, "object", {}  );

        const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance( walletAddress.decryptPublicKeyHash(), tokenCurrency );
        if (!foundFunds) throw new Exception(this, "Not enough funds");

        const memPoolPending = this._scope.memPool.getMemPoolPendingBalance( walletAddress.decryptPublicAddress(networkByte), tokenCurrency )[ tokenCurrency.toString("hex") ] || 0;

        //calculate fee
        if (fee === undefined){
            fee = 0;
            //TODO CALCULATE FEE
        }

        if (foundFunds + memPoolPending < fee  ) throw new Exception(this, "Not enough funds", { foundFunds, memPoolPending, fee });

        const txOut =  await this._scope.mainChain.transactionsCreator.createDelegateSimpleTransaction( {
            vin: [{
                publicKey: walletAddress.decryptPublicKey(),
                amount: fee,
            }],
            vout: [],
            privateKeys: [ {
                privateKey: walletAddress.decryptPrivateKey()
            } ],
            nonce,
            delegateOld,
            delegate,
        } );

        await this._scope.memPool.newTransaction(txOut.tx, true, memPoolValidateTxData);

        return txOut;

    }

    async tokenCreate({address, fee, nonce, tokenData, memPoolValidateTxData, paymentId, password, networkByte}){

        const tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer;

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance( walletAddress.decryptPublicKeyHash(), tokenCurrency );
        if (!foundFunds) throw new Exception(this, "Not enough funds");

        const memPoolPending = this._scope.memPool.getMemPoolPendingBalance( walletAddress.decryptPublicAddress(networkByte), tokenCurrency )[ tokenCurrency.toString("hex") ] || 0;

        //calculate fee
        if (fee === undefined){
            fee = 0;
            //TODO CALCULATE FEE
        }

        if (foundFunds + memPoolPending < fee  ) throw new Exception(this, "Not enough funds", { foundFunds, memPoolPending, fee });


        const txOut =  await this._scope.mainChain.transactionsCreator.createTokenCreateSimpleTransaction( {
            vin: [{
                publicKey: walletAddress.decryptPublicKey(),
                amount: fee,
            }],
            vout: [],
            privateKeys: [ {
                privateKey: walletAddress.decryptPrivateKey()
            } ],
            nonce,
            tokenData,
        } );

        await this._scope.memPool.newTransaction(txOut.tx, true, memPoolValidateTxData);

        return txOut;
    }

    async tokenUpdateSupply({address, fee, nonce, tokenPublicKeyHash, supplySign, supplyValue, memPoolValidateTxData, paymentId, password, networkByte}){

        const tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer;

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance( walletAddress.decryptPublicKeyHash(), tokenCurrency );
        if (!foundFunds) throw new Exception(this, "Not enough funds");

        const memPoolPending = this._scope.memPool.getMemPoolPendingBalance( walletAddress.decryptPublicAddress(networkByte), tokenCurrency )[ tokenCurrency.toString("hex") ] || 0;

        //calculate fee
        if (fee === undefined){
            fee = 0;
            //TODO CALCULATE FEE
        }

        if (foundFunds + memPoolPending < fee  ) throw new Exception(this, "Not enough funds", { foundFunds, memPoolPending, fee });


        const txOut =  await this._scope.mainChain.transactionsCreator.createTokenUpdateSupplySimpleTransaction( {
            vin: [{
                publicKey: walletAddress.decryptPublicKey(),
                amount: fee,
            }],
            vout: [],
            privateKeys: [ {
                privateKey: walletAddress.decryptPrivateKey()
            } ],
            nonce,
            tokenPublicKeyHash,
            supplySign,
            supplyValue,
        } );

        await this._scope.memPool.newTransaction(txOut.tx, true, memPoolValidateTxData);

        return txOut;
    }

    _calculateRequiredFunds(txDsts){

        let requiredFunds = 0;
        for (let i = 0 ; i < txDsts.length; i++)
            requiredFunds += txDsts[i].amount;

        if (!this._scope.argv.transactions.coins.validateCoins(requiredFunds)) throw new Exception(this, "Invalid funds");

        return requiredFunds;
    }

    _processDstsAddresses(txDsts){

        const outs = [];
        for (let i=0; i < txDsts.length; i++){

            const address = this._scope.cryptography.addressValidator.validateAddress( txDsts[i].address );
            const publicKeyHash = address.publicKeyHash;

            outs[i] = {
                amount: txDsts[i].amount,
                publicKeyHash
            }

        }

        return outs;

    }

}