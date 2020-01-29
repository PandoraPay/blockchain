const {Exception, StringHelper, BufferHelper, EnumHelper} = global.protocol.helpers;
const {TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

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
            const balance = await this._scope.mainChain.data.accountTree.getBalance(publicKeyHash, token);

            if (balance && balance >= amount)
                return walletAddress;
        }

        //return undefined
    }

    async transferSimple( { address, txDsts, fee, tokenCurrency = TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id, nonce, memPoolValidateTxData, paymentId, password, networkByte} ){

        if (!Buffer.isBuffer(tokenCurrency) && StringHelper.isHex(tokenCurrency) ) tokenCurrency = Buffer.from(tokenCurrency, "hex");
        if (!EnumHelper.validateEnum( tokenCurrency.toString("hex") , TransactionTokenCurrencyTypeEnum) ) throw new Exception(this, "Token Currency was not found");

        const requiredFunds = this._calculateRequiredFunds(txDsts);

        const walletAddress = this.wallet.manager.getWalletAddressByAddress(address, false, password, networkByte );

        const foundFunds = await this._scope.mainChain.data.accountTree.getBalance( walletAddress.decryptPublicKeyHash(), tokenCurrency );
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
    
    async transferFunds( {address, txDsts, fee, paymentId, decoyCount, tokenCurrency} ){

        const requiredFunds = this._calculateRequiredFunds(txDsts);

        let foundFunds = 0;


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