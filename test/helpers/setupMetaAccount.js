const { ethers } = require('hardhat')
const getSigners = require('./getSigners')

const chainId = 1

const setupMetaAccount = async (owner) => {
  const MockAccount = await ethers.getContractFactory('MockAccount')
  const CallExecutor = await ethers.getContractFactory('CallExecutor')

  const { proxyDeployer, metaAccountOwner } = await getSigners()
  const Proxy = (await ethers.getContractFactory('Proxy')).connect(proxyDeployer)

  const accountOwner = owner || metaAccountOwner
  
  const callExecutor = await CallExecutor.deploy()
  const impl_0 = await MockAccount.deploy(callExecutor.address)
  const proxy = await Proxy.deploy(impl_0.address, accountOwner.address, chainId)
  const metaAccount = await ethers.getContractAt('MockAccountWithTestCalls', proxy.address)

  return { metaAccount, account: impl_0 }
}

module.exports = setupMetaAccount
