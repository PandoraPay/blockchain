export default {

    allowDelegating: true, //to allow other people to use the node for delegating staking

    allowDelegatingPrivateKey: false, //to allow delegating a specific private key. This should be false, because otherwise other people will delegate their private key to hundreds of different nodes proposing same block making a lot of uncles.

    minimumFeePercentage: 0,

    maximumStakeDelegates: 5000,
}