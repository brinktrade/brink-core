const { ethers } = require('hardhat')
const getSigners = require('./getSigners')

const setupContractOwnedAccount = async () => {
  const MockAccount = await ethers.getContractFactory('MockAccount')

  const { proxyDeployer } = await getSigners()
  const Proxy = (await ethers.getContractFactory('Proxy')).connect(proxyDeployer)

  // mocks GnosisSafe fallback handler to make sure this works with GnosisSafe
  const MockEIP1271ContractSigner = await ethers.getContractFactory('MockEIP1271ContractSigner')
  const MockEIP1271Validator = await ethers.getContractFactory('MockEIP1271Validator')
  const eip1271ContractSigner = await MockEIP1271ContractSigner.deploy()
  const eip1271Validator = await MockEIP1271Validator.deploy()
  await eip1271ContractSigner.setFallbackHandler(eip1271Validator.address)

  const proxyOwner = await MockEIP1271Validator.attach(eip1271ContractSigner.address)

  const canonicalAccount = await MockAccount.deploy()
  const proxy = await Proxy.deploy(canonicalAccount.address, proxyOwner.address)
  const contractOwnedAccount = await ethers.getContractAt('MockAccountWithTestCalls', proxy.address)

  return { contractOwnedAccount, account: canonicalAccount, proxyOwner }
}

module.exports = setupContractOwnedAccount
