const {describe} = global.kernel.tests;
const {DBEncryptedSchema, DBSchemaEncryptionTypeEnum} = global.cryptography.marshal.db.samples;
const {Helper, BufferHelper} = global.kernel.helpers;

export default function run () {

    const count = 10;
    let wallet;

    describe("Tests Wallet", {


        'clear': async function () {

            wallet = this._scope.wallet;

            await wallet.clearWallet();
            this.expect(wallet.addresses.length, 0);

            await wallet.loadWallet();
            this.expect(wallet.addresses.length, 1);

        },

        'create wallets': async function () {

            await wallet.clearWallet();

            const mnemonic = await wallet.encryption.decryptMnemonic();
            this.expect( Array.isArray( mnemonic ), true );
            this.expect( mnemonic.length, 24 );

            let mnemonicSequenceCounter = wallet.encryption.decryptMnemonicSequenceCounter();
            this.expect(mnemonicSequenceCounter, 1);

            for (let i = 0; i < count; i++) {
                await wallet.manager.createNewAddress();
                this.expect(wallet.addresses.length, i + 1);
                mnemonicSequenceCounter = wallet.encryption.decryptMnemonicSequenceCounter();
                this.expect(mnemonicSequenceCounter, i+2 );
            }

            for (const walletAddress of wallet.addresses){
                
                const json = walletAddress.toJSON();
                const hash = walletAddress.hash();
                
                walletAddress.fromJSON( json );
                this.expect(walletAddress.hash(), hash);

                const buffer = walletAddress.toBuffer();
                walletAddress.fromBuffer(buffer);
                this.expect(walletAddress.hash(), hash);
            }

            await wallet.loadWallet();
            this.expect(wallet.addresses.length, count);

        },

        'export & import wallets': async function () {

            await wallet.clearWallet();

            for (let i = 0; i < count; i++)
                await wallet.manager.createNewAddress();

            this.expect(wallet.addresses.length, count);

            const json = wallet.toJSON();

            await wallet.clearWallet();
            this.expect(wallet.addresses.length, 0);
            wallet.fromJSON( json );
            this.expect(wallet.addresses.length, count );

            const buffer = wallet.toBuffer();

            await wallet.clearWallet();
            this.expect(wallet.addresses.length, 0);
            wallet.fromBuffer( buffer );
            this.expect(wallet.addresses.length, count );

        },


        'create wallets encrypted': async function(){

            await wallet.clearWallet();

            const mnemonic = await wallet.encryption.decryptMnemonic();
            this.expect( Array.isArray( mnemonic ), true );
            this.expect( mnemonic.length, 24 );

            let mnemonicSequenceCounter = wallet.encryption.decryptMnemonicSequenceCounter();
            this.expect(mnemonicSequenceCounter, 1);

            //let's encrypt it

            const password = BufferHelper.generateRandomBuffer( 32 );
            await wallet.encryption.encryptWallet(undefined, password );

            this.expect( wallet.encrypted, true );
            this.expect(wallet.mnemonic.value.length >= 100, true);

            mnemonicSequenceCounter = wallet.encryption.decryptMnemonicSequenceCounter();
            this.expect(mnemonicSequenceCounter, 1);

            this.expect(wallet.mnemonicSequenceCounter.value.length, 32);

            for (let i = 0; i < count; i++) {
                await wallet.manager.createNewAddress();
                this.expect(wallet.addresses.length, i + 1);

                this.expect(wallet.addresses[i].keys.public.value.length, 64 );
                this.expect(wallet.addresses[i].keys.private.value.length, 64 );

                mnemonicSequenceCounter = wallet.encryption.decryptMnemonicSequenceCounter();
                this.expect(mnemonicSequenceCounter, i + 2);

                this.expect(wallet.mnemonicSequenceCounter.value.length, 32);
            }


            //try to load it again
            await wallet.load();
            wallet.encryption.logoutEncryptionWallet();


            this.expect(wallet.encrypted, true);
            this.expect(wallet.mnemonic.value.length >= 100, true);

            try{
                wallet.encryption.decryptMnemonicSequenceCounter("123456");
                throw "err"
            }catch(err){
                if (err === "err") throw "It didn't raise an error";
            }

            mnemonicSequenceCounter = wallet.encryption.decryptMnemonicSequenceCounter(password);
            this.expect(mnemonicSequenceCounter, count+1);
            this.expect(wallet.mnemonicSequenceCounter.value.length, 32);

            mnemonicSequenceCounter = wallet.encryption.decryptMnemonicSequenceCounter();
            this.expect(mnemonicSequenceCounter, count + 1);

            this.expect(wallet.addresses.length, count );

            for (let i = 0; i < count; i++) {

                this.expect(wallet.addresses[i].keys.public.value.length, 64 );
                this.expect(wallet.addresses[i].keys.private.value.length, 64 );

                this.expect(wallet.mnemonicSequenceCounter.value.length, 32);

            }

        },

        'encrypt it, add account, decrypt it, load it decrypted': async function (){

            await wallet.clearWallet();

            const password = BufferHelper.generateRandomBuffer( 32 );

            await wallet.manager.createNewAddress();

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(false), true);

            await wallet.encryption.encryptWallet(undefined, password);

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(true), true);

            await wallet.load();

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(true), true);

            await wallet.encryption.decryptWallet(password);

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(true), true);

            await wallet.manager.createNewAddress();

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(true), true);

            await wallet.encryption.removeEncryptionWallet(password);

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(false), true);

            await wallet.load();

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(false), true);

            await wallet.manager.createNewAddress();

            await wallet.save();

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(false), true);

            await wallet.load();

            this.expect(  wallet.encryption.checkIfIsReallyEncrypted(false), true);


        },

        'clear wallet for tests': async function (){

            await wallet.clearWallet();

            if (this._scope.argv.testnet.createNewTestNetGenesisAndWallet)
                await this._scope.testnet.createTestNetGenesisAndWallet();

        },

    });

}