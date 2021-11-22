const { ethers } = require('hardhat')
const proxyAccountFromOwner = require('./proxyAccountFromOwner')

// creates a random Proxy signer and it's Proxy account, without deploying the Proxy contract.
// tests need to use random accounts, otherwise deterministic proxy account deployments will collide between tests
// and bad things happen
async function randomProxyAccount () {
  const [defaultSigner] = await ethers.getSigners()
  const signer = (await ethers.Wallet.createRandom()).connect(ethers.provider)

  // fund the randomly created wallet signer with some eth
  await defaultSigner.sendTransaction({
    to: signer.address,
    value: ethers.BigNumber.from('10000000000000000000000000')
  })

  const proxyAccountAddress = await proxyAccountFromOwner(signer.address)
  const Account = await ethers.getContractFactory('Account')
  const proxyAccount = await Account.attach(proxyAccountAddress)
  
  return { proxyOwner: signer, proxyAccount }
}

module.exports = randomProxyAccount
