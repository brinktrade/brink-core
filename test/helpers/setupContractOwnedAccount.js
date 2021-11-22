const { ethers } = require('hardhat')
const { ACCOUNT } = require('../../constants')
const deployProxyAccount =require('./deployProxyAccount')
const deployMasterAccount = require('./deployMasterAccount')

const setupContractOwnedAccount = async () => {
  await deployMasterAccount()

  // mocks GnosisSafe fallback handler to make sure this works with GnosisSafe
  const MockEIP1271ContractSigner = await ethers.getContractFactory('MockEIP1271ContractSigner')
  const MockEIP1271Validator = await ethers.getContractFactory('MockEIP1271Validator')
  const eip1271ContractSigner = await MockEIP1271ContractSigner.deploy()
  const eip1271Validator = await MockEIP1271Validator.deploy()
  await eip1271ContractSigner.setFallbackHandler(eip1271Validator.address)

  const proxyOwner = await MockEIP1271Validator.attach(eip1271ContractSigner.address)
  const proxy = await deployProxyAccount(proxyOwner.address)
  const canonicalAccount = await ethers.getContractAt('Account', ACCOUNT)
  const contractOwnedAccount = await ethers.getContractAt('AccountWithTestCalls', proxy.address)

  return { contractOwnedAccount, account: canonicalAccount, proxyOwner }
}

module.exports = setupContractOwnedAccount
