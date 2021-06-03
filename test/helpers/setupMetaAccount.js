const { ethers } = require('hardhat')
const getSigners = require('./getSigners')

const chainId = 1

const setupMetaAccount = async (owner) => {
  const MockAccountLogic = await ethers.getContractFactory('MockAccountLogic')
  const CallExecutor = await ethers.getContractFactory('CallExecutor')

  const { proxyDeployer, metaAccountOwner } = await getSigners()
  const Proxy = (await ethers.getContractFactory('Proxy')).connect(proxyDeployer)

  const accountOwner = owner || metaAccountOwner
  
  const callExecutor = await CallExecutor.deploy()
  const impl_0 = await MockAccountLogic.deploy(callExecutor.address)
  const proxy = await Proxy.deploy(impl_0.address, accountOwner.address, chainId)
  const metaAccount = await MockAccountLogic.attach(proxy.address)

  return { metaAccount, accountLogic: impl_0 }
}

module.exports = setupMetaAccount
