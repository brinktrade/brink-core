const { ethers } = require('hardhat')
const getSigners = require('./getSigners')

const chainId = 1

const setupMetaAccount = async (owner) => {
  const MockAccount = await ethers.getContractFactory('MockAccount')
  const CallExecutor = await ethers.getContractFactory('CallExecutor')

  const { proxyDeployer, metaAccountOwner } = await getSigners()
  const Proxy = (await ethers.getContractFactory('Proxy')).connect(proxyDeployer)

  const proxyAccountOwner = owner || metaAccountOwner
  
  const callExecutor = await CallExecutor.deploy()
  const canonicalAccount = await MockAccount.deploy(callExecutor.address, chainId)
  const proxy = await Proxy.deploy(canonicalAccount.address, proxyAccountOwner.address)
  const metaAccount = await ethers.getContractAt('MockAccountWithTestCalls', proxy.address)

  return { metaAccount, account: canonicalAccount }
}

module.exports = setupMetaAccount
