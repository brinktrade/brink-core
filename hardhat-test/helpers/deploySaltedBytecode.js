const { ethers } = require('hardhat')
const { SINGLETON_FACTORY, SALTED_DEPLOYER_SALT } = require('../../constants')
const deploySingletonFactory = require('./deploySingletonFactory')
const saltedDeployAddress = require('./saltedDeployAddress')

async function deploySaltedBytecode (bytecode, initParamTypes = [], initParamValues = []) {
  await deploySingletonFactory()

  const SaltedDeployer = await ethers.getContractFactory('SaltedDeployer')
  // doesn't matter what saltedDeployer address is, since SingletonFactory will exec the create2 call
  const saltedDeployer = await SaltedDeployer.deploy()

  const { address: address_JS, initCode } = saltedDeployAddress(
    SINGLETON_FACTORY, SALTED_DEPLOYER_SALT, bytecode, initParamTypes, initParamValues
  )
  const address_Solidity = await saltedDeployer.getDeployAddress(initCode)

  if (address_JS !== address_Solidity) {
    throw new Error(`deploySaltedBytecode failed: JS computed address ${address_JS} does not match Solidity computed address ${address_Solidity}`)
  }

  if (await ethers.provider.getCode(address_Solidity) == '0x') {
    await saltedDeployer.deploy(initCode)
  }

  if (await ethers.provider.getCode(address_Solidity) == '0x') {
    throw new Error(`deploySaltedBytecode failed: No contract at expected address ${address_Solidity}`)
  }

  return address_Solidity
}

module.exports = deploySaltedBytecode
