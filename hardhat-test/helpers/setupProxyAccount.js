const { ethers } = require('hardhat')
const { ACCOUNT } = require('../../constants')
const deployProxyAccount =require('./deployProxyAccount')
const randomProxyAccount =require('./randomProxyAccount')
const deployMasterAccount = require('./deployMasterAccount')

const setupProxyAccount = async (owner) => {
  await deployMasterAccount()
  const proxyOwner = owner || (await randomProxyAccount()).proxyOwner
  const proxy = await deployProxyAccount(proxyOwner.address)
  const canonicalAccount = await ethers.getContractAt('Account', ACCOUNT)
  const proxyAccount = await ethers.getContractAt('AccountWithTestCalls', proxy.address)
  return { proxyOwner, proxyAccount, account: canonicalAccount }
}

module.exports = setupProxyAccount
