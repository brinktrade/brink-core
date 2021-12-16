const hre = require('hardhat')
const { ethers } = hre
const { randomHex, toChecksumAddress } = require('web3-utils')
const proxyAccountFromOwner = require('./proxyAccountFromOwner')

// creates a random Proxy signer and it's Proxy account, without deploying the Proxy contract.
// tests need to use random accounts, otherwise deterministic proxy account deployments will collide between tests
// and bad things happen
async function randomProxyAccount (opts = {}) {
  const leadingZeros = opts.leadingZeros || 0
  const trailingZeros = opts.trailingZeros || 0
  const impersonate = opts.impersonate || leadingZeros > 0 || trailingZeros > 0

  const [defaultSigner] = await ethers.getSigners()

  let signer
  
  // if leading or trailing zeros are needed, impersonate the address to create a signer w/o a private key
  // otherwise, use ethers.Wallet.createRandom() to generate a random private key / address
  if (impersonate) {
    let addr = randomHex(20)
    if (leadingZeros > 0) {
      addr = `${addr.substr(0, 2)}${'0'.repeat(leadingZeros)}${addr.substr(2 + leadingZeros)}`
    }
    if (trailingZeros > 0) {
      addr = `${addr.substr(0, 42 - trailingZeros)}${'0'.repeat(trailingZeros)}`
    }

    const ownerAddr = toChecksumAddress(addr)

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ownerAddr],
    })
    signer = await ethers.getSigner(ownerAddr)
  } else {
    signer = (await ethers.Wallet.createRandom()).connect(ethers.provider)
  }

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
