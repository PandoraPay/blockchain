const {Exception, StringHelper, BufferHelper, EnumHelper} = require('kernel').helpers;
const {TxTokenCurrencyTypeEnum} = require('cryptography').transactions;
const {MarshalFields} = require('kernel').marshal;

module.exports = class WalletTransfer {

    constructor(scope){
        this._scope = scope;
    }

    get wallet(){
        return this._scope.wallet;
    }

    async findWalletAddressThatIsGreaterThanAmount( amount, token, password){

        this.wallet.encryption.decryptWallet(password);

        for (const walletAddress of this.wallet.addresses){
            const publicKeyHash = walletAddress.keys.decryptPublicKeyHash();
            const balance = await this._scope.mainChain.data.accountHashMap.getBalance(publicKeyHash, token);

            if (balance && balance >= amount)
                return walletAddress;
        }

    }

    async transferSimple( { address, txDsts, fee, feeTokenCurrency = TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer, nonce, memPoolValidateTxData, extra, password, networkByte} ){

        if (txDsts && !Array.isArray(txDsts)) txDsts = [txDsts];

        if (extra && !Buffer.isBuffer(extra) )
            extra = await this.generateExtra(extra.extraMessage, extra.extraEncryptionOption)

        const {vin, privateKeys} = await this._calculateRequiredFunds({address, txDsts, fee, feeTokenCurrency, password, networkByte});

        const outs = this._processDstsAddresses(txDsts);

        const txOut =  await this._scope.mainChain.transactionsCreator.createSimpleTransaction( {
            vin: vin,
            vout: outs,
            privateKeys,
            nonce,
            extra,
        } );

        await this._scope.memPool.newTransaction( txOut.tx.hash(), txOut.tx,  false,true, memPoolValidateTxData, true );

        return txOut;
    }

    async changeDelegate({address, fee, nonce, delegate, memPoolValidateTxData, extra, password, networkByte }){

        const tokenCurrency = TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer;

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        if (delegate && typeof delegate.delegatePublicKeyHash === "string" && StringHelper.isHex(delegate.delegatePublicKeyHash ) )
            delegate.delegatePublicKeyHash = MarshalFields.marshal_buffer_toBuffer( Buffer.from( delegate.delegatePublicKeyHash, "hex"), {
                specifyLength: true,
                minSize: 20,
                maxSize: 20,
            }, "delegatePublicKeyHash", ()=>{}, "object", {}  );

        if (extra && !Buffer.isBuffer(extra) )
            extra = await this.generateExtra(extra.extraMessage, extra.extraEncryptionOption);

        const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance( walletAddress.keys.decryptPublicKeyHash(), tokenCurrency );
        if (!foundFunds) throw new Exception(this, "Not enough funds");

        const memPoolPending = this._scope.memPool.getMemPoolPendingBalance(walletAddress.keys.decryptPublicKeyHash(), tokenCurrency )[ tokenCurrency.toString("hex") ] || 0;

        //calculate fee
        if (fee === undefined) fee = this.computeFee();

        if (foundFunds + memPoolPending < fee  ) throw new Exception(this, "Not enough funds", { foundFunds, memPoolPending, fee });

        const txOut =  await this._scope.mainChain.transactionsCreator.createDelegateSimpleTransaction( {
            vin: [{
                publicKey: walletAddress.keys.decryptPublicKey(),
                amount: fee,
            }],
            vout: [],
            privateKeys: [ {
                privateKey: walletAddress.keys.decryptPrivateKey()
            } ],
            extra,
            nonce,
            delegate,
        } );

        await this._scope.memPool.newTransaction(txOut.tx.hash(), txOut.tx, false, true, memPoolValidateTxData, true);

        return txOut;
    }

    async tokenCreate({address, fee, nonce, tokenData, memPoolValidateTxData, extra, password, networkByte}){

        const tokenCurrency = TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer;

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        if (extra && !Buffer.isBuffer(extra) )
            extra = await this.generateExtra(extra.extraMessage, extra.extraEncryptionOption);

        const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance( walletAddress.keys.decryptPublicKeyHash(), tokenCurrency );
        if (!foundFunds) throw new Exception(this, "Not enough funds");

        const memPoolPending = this._scope.memPool.getMemPoolPendingBalance(walletAddress.keys.decryptPublicKeyHash(), tokenCurrency )[ tokenCurrency.toString("hex") ] || 0;

        //calculate fee
        if (fee === undefined) fee = this.computeFee();

        if (foundFunds + memPoolPending < fee  ) throw new Exception(this, "Not enough funds", { foundFunds, memPoolPending, fee });

        const txOut =  await this._scope.mainChain.transactionsCreator.createTokenCreateSimpleTransaction( {
            vin: [{
                publicKey: walletAddress.keys.decryptPublicKey(),
                amount: fee,
            }],
            vout: [],
            privateKeys: [ {
                privateKey: walletAddress.keys.decryptPrivateKey()
            } ],
            extra,
            nonce,
            tokenData,
        } );

        await this._scope.memPool.newTransaction(txOut.tx.hash(), txOut.tx, false,true, memPoolValidateTxData, true);

        return txOut;
    }

    async tokenUpdateSupply({address, fee, nonce, tokenPublicKeyHash, supplySign, supplyValue, memPoolValidateTxData, extra, password, networkByte}){

        const tokenCurrency = TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer;

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        if (extra && !Buffer.isBuffer(extra) )
            extra = await this.generateExtra(extra.extraMessage, extra.extraEncryptionOption);

        const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance( walletAddress.keys.decryptPublicKeyHash(), tokenCurrency );
        if (!foundFunds) throw new Exception(this, "Not enough funds");

        const memPoolPending = this._scope.memPool.getMemPoolPendingBalance(walletAddress.keys.decryptPublicKeyHash(), tokenCurrency )[ tokenCurrency.toString("hex") ] || 0;

        //calculate fee
        if (fee === undefined) fee = this.computeFee();

        if (foundFunds + memPoolPending < fee  ) throw new Exception(this, "Not enough funds", { foundFunds, memPoolPending, fee });


        const txOut =  await this._scope.mainChain.transactionsCreator.createTokenUpdateSupplySimpleTransaction( {
            vin: [{
                publicKey: walletAddress.keys.decryptPublicKey(),
                amount: fee,
            }],
            vout: [],
            privateKeys: [ {
                privateKey: walletAddress.keys.decryptPrivateKey()
            } ],
            extra,
            nonce,
            tokenPublicKeyHash,
            supplySign,
            supplyValue,
        } );

        await this._scope.memPool.newTransaction(txOut.tx.hash(), txOut.tx, false, true, memPoolValidateTxData, true);

        return txOut;
    }

    async _calculateRequiredFunds({address, txDsts, extra, fee, feeTokenCurrency, password, networkByte}){

        if ( typeof feeTokenCurrency === "string" && StringHelper.isHex(feeTokenCurrency) ) feeTokenCurrency = Buffer.from(feeTokenCurrency, "hex");

        const requiredFunds = {};

        for (let i = 0 ; i < txDsts.length; i++) {
            let tokenCurrency = txDsts[i].tokenCurrency || TxTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.idBuffer ;
            if ( Buffer.isBuffer(tokenCurrency) ) tokenCurrency = tokenCurrency.toString('hex');

            requiredFunds[ tokenCurrency ] = (requiredFunds[ tokenCurrency ] || 0) + txDsts[i].amount;
        }

        let currencies = 0;
        for (const tokenCurrency in requiredFunds) {
            currencies += 1;
            if (!this._scope.argv.transactions.coins.validateCoins(requiredFunds[tokenCurrency])) throw new Exception(this, "Invalid funds");
        }

        if (currencies === 0) throw new Exception(this, "no outputs, it is required to have at least 1");

        for (const tokenCurrency in requiredFunds)
            await this._scope.mainChain.data.tokenHashMap.currencyExists(tokenCurrency);

        //calculate fee
        if (fee === undefined) fee = this.computeFee();

        if ( requiredFunds[ feeTokenCurrency.toString('hex') ] ) await this._scope.mainChain.data.tokenHashMap.currencyExists(feeTokenCurrency);

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        for (const tokenCurrency in requiredFunds) {

            const foundFunds = await this._scope.mainChain.data.accountHashMap.getBalance(walletAddress.keys.decryptPublicKeyHash(), tokenCurrency);
            if (!foundFunds) throw new Exception(this, "Not enough funds");

            const memPoolPending = this._scope.memPool.getMemPoolPendingBalance(walletAddress.keys.decryptPublicKeyHash(), tokenCurrency)[tokenCurrency] || 0;

            requiredFunds[tokenCurrency] = {
                tokenCurrency,
                required: requiredFunds[tokenCurrency],
                foundFunds: foundFunds + memPoolPending,
                fee: tokenCurrency === feeTokenCurrency.toString('hex') ? fee : 0
            };

            if (requiredFunds[tokenCurrency].requiredFunds < requiredFunds[tokenCurrency] + requiredFunds[tokenCurrency].fee)
                throw new Exception(this, "Not enough funds", requiredFunds[tokenCurrency]);

        }

        const vin = [], privateKeys = [];

        for (const tokenCurrency in requiredFunds) {
            vin.push({
                publicKey: walletAddress.keys.decryptPublicKey(),
                amount: requiredFunds[tokenCurrency].required + requiredFunds[tokenCurrency].fee,
                tokenCurrency: requiredFunds[tokenCurrency].tokenCurrency,
            });
            privateKeys.push({
                privateKey: walletAddress.keys.decryptPrivateKey()
            });
        }

        return {requiredFunds, walletAddress, vin, privateKeys};
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

    computeFee(){
        //TODO CALCULATE FEE
        return 0;
    }

    async generateExtra(extraMessage, extraEncryptionOption){

        if (typeof extraMessage === "string")
            extraMessage = Buffer.from(extraMessage);

        if ( !extraEncryptionOption ) return Buffer.concat([ Buffer.from('00','hex'), extraMessage ]);

        const encrypted = await this._scope.cryptography.cryptoSignature.encrypt(extraMessage, extraEncryptionOption );
        return Buffer.concat([Buffer.from('01', 'hex'), encrypted]);
    }

}