const { ethers } = require('hardhat')
const { ACCOUNT_FACTORY } = require('../../constants')
const deployMasterAccount = require('./deployMasterAccount')
const deployAccountFactory = require('./deployAccountFactory')
const saltedDeployAddress = require('./saltedDeployAddress')

const chainId = 1

async function deployProxyAccount (ownerAddress) {
  const Proxy = await ethers.getContractFactory('Proxy')

  await deployMasterAccount(chainId)
  const accountFactory = await deployAccountFactory()

  const { address: proxyAddress } = saltedDeployAddress(ACCOUNT_FACTORY, Proxy.bytecode, ['address'], [ownerAddress])

  if (await ethers.provider.getCode(proxyAddress) == '0x') {
    await accountFactory.deployAccount(ownerAddress)
  }

  if (await ethers.provider.getCode(proxyAddress) == '0x') {
    throw new Error(`Proxy deploy to ${proxyAddress} failed`)
  }

  const proxy = Proxy.attach(proxyAddress)
  return proxy
}

module.exports = deployProxyAccount