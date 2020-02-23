const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

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

        this.delegatedStakes = []; //sorted
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
        if (out){

            console.log("out", out);

            for (const delegateStake in out)
                this.delegatedStakes.push( delegateStake );

        }


        return true;
    }

    sortDelegatedStakes(){
        return this.delegatedStakes.sort( (a,b) => a.amount - b.amount );
    }

}