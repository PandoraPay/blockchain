const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper, StringHelper} = global.kernel.helpers;

import DelegatedStake from "./delegated-stake/delegated-stake"

export default class WalletStakes extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

            fields: {

                table: {
                    default: "walletStakes",
                    fixedBytes: 12,
                },

            }

        }, schema, false), data, type, creationOptions);

        this.dataSubscription = new DBSchema(this._scope);

        this._initialized = false;

        this.delegatedStakes = []; //sorted by amount
        this.delegatedStakesMap = {};
    }

    async initializeWalletStakes() {

        if (this._initialized) return true;

        await this.dataSubscription.subscribe();
        this.dataSubscription.subscription.on( async message => {

            if (message.name === "update-delegate-stake") {

                this._scope.logger.warn(this, "check-delegate-stake", message.data.end - 1);

                const {publicKeyHash, delegatePublicKey, delegatePrivateKey} = message.data;

                try {

                    const oldDelegateStake = this.delegatedStakesMap[publicKeyHash];
                    if (oldDelegateStake) {

                        if (oldDelegateStake.delegatePublicKey.equals(delegatePublicKey) && oldDelegateStake.delegatePrivateKey.equals(delegatePrivateKey))
                            return true;


                        oldDelegateStake.delegatePublicKey = delegatePublicKey;
                        oldDelegateStake.delegatePrivateKey = delegatePrivateKey;

                        await oldDelegateStake.save();

                        return true;
                    }

                    return false;

                } catch (err) {

                }

            }

        });

        this._initialized = true;
        return true;

    }

    async addWalletStake({publicKeyHash, delegatePublicKey, delegatePrivateKey}){

        if (typeof publicKeyHash === "string" && StringHelper.isHex(publicKeyHash)) publicKeyHash = Buffer.from(publicKeyHash, "hex");
        if (typeof delegatePublicKey === "string" && StringHelper.isHex(delegatePublicKey)) delegatePublicKey = Buffer.from(delegatePublicKey, "hex");
        if (typeof delegatePrivateKey === "string" && StringHelper.isHex(delegatePrivateKey)) delegatePrivateKey = Buffer.from(delegatePrivateKey, "hex");

        const lock = this.lock(-1, publicKeyHash.toString("hex") );

        try{

            const exists = await this.dataSubscription.subscribeMessage("update-delegate-stake", {
                publicKeyHash, delegatePublicKey, delegatePrivateKey
            }, true);

            for (let i=0; i < exists.length; i++)
                if ( exists[i] )
                    return true;

            const delegateStake = new DelegatedStake(this._scope,undefined, {
                id: publicKeyHash.toString("hex"),
                publicKeyHash: publicKeyHash.toString("hex"),
                delegatePublicKey: delegatePublicKey.toString("hex"),
                delegatePrivateKey: delegatePrivateKey.toString("hex"),
            });

        }finally{
            lock();
        }

    }

    async clearWalletStakes(save = true){

        await this.delete();

        if (save)
            await this.save();
    }

    onLoaded(){
        

    }

    async loadWalletStakes(){


        const out = await this._scope.db.findAll( DelegatedStake );

        console.log("loadWalletStakes out", out);


        if (out){

            for (const delegateStake in out) {
                this.delegatedStakes.push(delegateStake);
                this.delegatedStakesMap[delegateStake.id] = delegateStake;
            }

        }


        return true;
    }

    sortDelegatedStakes(){
        return this.delegatedStakes.sort( (a,b) => a.amount - b.amount );
    }

}