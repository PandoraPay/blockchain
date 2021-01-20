const {Helper, Exception} = global.kernel.helpers;
const {TransactionTypeEnum, TransactionScriptTypeEnum, TransactionTokenCurrencyTypeEnum} = global.cryptography.transactions;

import BlockchainSimpleTransaction from "./../../simple-transaction/blockchain-simple-transaction"
import SidechainHashMapData from "../../../chain/maps/sidechains/sidechains-hash/data/sidechain-hash-map-data";
import SidechainStatusTypeEnum from "../../../chain/maps/sidechains/sidechains-hash/data/sidechain-status-type-enum";

export default class BlockchainSidechainCreateSimpleTransaction extends BlockchainSimpleTransaction {

    constructor(scope, schema={}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                scriptVersion:{

                    default: TransactionScriptTypeEnum.TX_SCRIPT_SIDECHAIN_CREATE_TRANSACTION,

                    validation(script){
                        return script === TransactionScriptTypeEnum.TX_SCRIPT_SIDECHAIN_CREATE_TRANSACTION;
                    }
                },

                vin:{
                    minSize: 1,
                    maxSize: 1,
                    fixedBytes: 1,
                    specifyLength: false,
                },

                vout:{
                    minSize: 2,
                    maxSize: 2,
                    fixedBytes: 2,
                    specifyLength: false,
                },

                sidechainPublicKeyHash:{
                    type: "buffer",
                    fixedBytes: 20,

                    position: 2000,
                },

                sidechainData:{
                    type: "object",
                    classObject: SidechainHashMapData,

                    position: 2001,
                }


            }

        }, schema, false), data, type, creationOptions);

    }

    async validateTransaction(chain = this._scope.chain, chainData = chain.data, block){

        const out = await super.validateTransaction(chain, chainData, block);
        if (!out) return false;

        const balance = await chainData.accountHashMap.getBalance( this.vin[0].publicKeyHash  ) || 0;
        if ( !balance) throw new Exception(this, "account doesn't exist");

        if (balance <= this.vin[0].amount ) throw new Exception(this, "resulting balance would be zero" );

        if (this.vout.length !== 2 || !this.vout[0].publicKeyHash.equals(this._scope.argv.blockchain.genesis.BURN_PUBLIC_KEY_HASH) )
            throw new Exception(this, 'A burning fee has to be paid');

        if (!this._scope.argv.transactions.sidechains.validateCreateSidechainFee( this.vout[0].amount, block.height ))
            throw new Exception(this, 'Fee too small for creating a new token to avoid spamming with useless tokens');

        if ( !this.vout[0].tokenCurrency.equals(TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id) || !this.vout[1].tokenCurrency.equals(TransactionTokenCurrencyTypeEnum.TX_TOKEN_CURRENCY_NATIVE_TYPE.id) )
            throw new Exception(this, 'TokenCurrency for creating a new token to avoid spamming with useless tokens is invalid');

        if ( !this.vout[1].publicKeyHash.equals(this._scope.argv.blockchain.genesis.COINS_LOCKED_PUBLIC_KEY_HASH) )
            throw new Exception(this, 'A security deposit has to be added');

        if ( !this._scope.argv.transactions.sidechains.validateMinimumSecurityDeposit( this.vout[1].amount, block.height) )
            throw new Exception(this, 'The security deposit needs to be equal of higher than a minimum value');

        if ( this.sidechainData.sidechainStatus !== SidechainStatusTypeEnum.SIDECHAIN_STATUS_ENABLED ) throw new Exception(this, 'sidechainStatus is invalid');

        const sidechainPublicKeyHash = this._scope.cryptography.addressGenerator.generateContractPublicKeyHashFromAccountPublicKeyHash( this.vin[0].publicKeyHash, this.nonce );
        if ( !sidechainPublicKeyHash.equals(this.sidechainPublicKeyHash) ) throw new Exception(this, 'sidechainPublicKeyHash is not matching');

        const exists = await chainData.sidechainHashMap.getTokenNode( sidechainPublicKeyHash );
        if (exists) throw new Exception(this, 'Sidechain already exists');

        const existsTokenName = await chainData.sidechainNameHashMap.getMap( this.sidechainData.name.toLowerCase() );
        if (existsTokenName) throw new Exception(this, 'Sidechain name already exists');

        return true;
    }

    async transactionAdded(chain = this._scope.chain, chainData = chain.data, block, merkleHeight, merkleLeafHeight){

        await super.transactionAdded(chain, chainData, block, merkleHeight, merkleLeafHeight);

        await chainData.sidechainHashMap.addMap(this.sidechainPublicKeyHash, this.sidechainData.toJSON() );
        await chainData.sidechainNameHashMap.addMap(this.sidechainData.name.toLowerCase(), this.sidechainPublicKeyHash.toString('hex') );

        return true;
    }

    async transactionRemoved(chain = this._scope.chain, chainData = chain.data , block, merkleHeight, merkleLeafHeight){

        await chainData.sidechainHashMap.deleteMap(this.sidechainPublicKeyHash);
        await chainData.sidechainNameHashMap.deleteMap(this.sidechainData.name.toLowerCase()  );

        return super.transactionRemoved(chain, chainData);

    }

}