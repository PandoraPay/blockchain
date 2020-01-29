const {Helper, Exception} = global.kernel.helpers;
const {DBSchema} = global.kernel.marshal.db;
const {BN} = global.kernel.utils;

import Interlink from "./interlink"

/**
 *
 * 0 - Genesis
 * 1 - level0
 * 2 - level1
 * .
 * .
 * .
 * n+1 - leveln
 *
 */

export default class BlockInterlinks extends DBSchema{

    constructor(scope, schema = { }, data, type , creationOptions){

        super(scope, Helper.merge( {

                fields:{

                    table: {
                        default: "links",
                        fixedBytes: 5,
                    },


                    id: {
                        default(){
                            return `links_${this.block.height}`;
                        },
                        maxSize: 12,
                        minSize: 3,
                    },


                    /**
                     * Input Transaction used for Forging
                     *
                     * Instead of using TxHash, Global_index is used
                     */
                    links: {

                        type: "array",
                        classObject: Interlink,
                        
                        minSize: 0,
                        maxSize: 256,

                        position: 100,
                    },

                },


            },
            schema, false), data, type, creationOptions);

    }

    /**
     *
     */
    get level(){

        if ( this._level ) return this._level;

        const target = new BN( this.block.target, 16 );
        const hash = new BN( this.hash() );

        this._level = Math.trunc(  Math.log2(  target ) - Math.log2( hash ) );

        return this._level;

    }

    /**
     * Due to POS, this.hash doesn't include interlinks
     */
    async createInterlinks(chain = this._scope.chain, chainData = chain.data){

        const interlinks = [ {
            height: 0,
            block: this._scope.genesis.prevHash
        }];

        if (this.block.height === 0) return interlinks;

        let prevBlock =  await chainData.getBlock( this.block.height - 1 );


        for (let i = 0, n = Math.max( prevBlock.interlinks.links.length, this.level + 2  ) ; i < n; ++i) {

            interlinks[i] = {

                height: i <= prevBlock.level ? prevBlock.height : this.height,
                block: i <= prevBlock.level ? prevBlock.hash() : this.hash(),

            };

        }

        return interlinks;

    }

    async setInterlinks(chain = this._scope.chain){

        const links = await this.createInterlinks(chain );

        this.links = [];

        for (let i=0; i < links.length; i++){

            const obj = this._createSchemaObject(
                {

                },
                "object",
                "links",
                undefined,
                undefined,
                i
            );

            obj.height = links[i].height;
            obj.block = links[i].block;

            this.links.push(obj);

        }

    }

    get block(){
        return this._scope.parent;
    }

    async validateInterlinks(chain = this._scope.chain){

        const interlinks = await this.createInterlinks(chain);
        
        if (interlinks.length !== this.links.length)
            throw new Exception(this, "interlinks level is not right");
        
        for (let i=0; i < interlinks.length; i++)
            if (interlinks[i].height !== this.links[i].height || !interlinks[i].block.equals( this.links[i].block ) )
                throw new Exception( this, "interlink doesn't match", { height: i });
        
    }

}