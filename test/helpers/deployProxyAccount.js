const { ethers } = require('hardhat')
const { ACCOUNT_FACTORY, PROXY_DEPLOY_SALT } = require('../../constants')
const deployMasterAccount = require('./deployMasterAccount')
const deployAccountFactory = require('./deployAccountFactory')
const saltedDeployAddress = require('./saltedDeployAddress')
const proxyBytecode = require('./proxyBytecode')

async function deployProxyAccount (ownerAddress) {
  await deployMasterAccount()
  const accountFactory = await deployAccountFactory()

  const { address: proxyAddress } = saltedDeployAddress(
    ACCOUNT_FACTORY, PROXY_DEPLOY_SALT, await proxyBytecode(ownerAddress), [], []
  )

  if (await ethers.provider.getCode(proxyAddress) == '0x') {
    await accountFactory.deployAccount(ownerAddress)
  }

  if (await ethers.provider.getCode(proxyAddress) == '0x') {
    throw new Error(`Proxy deploy to ${proxyAddress} failed`)
  }

  const Account = await ethers.getContractFactory('Account')
  const proxy = Account.attach(proxyAddress)
  return proxy
}

module.exports = deployProxyAccount
