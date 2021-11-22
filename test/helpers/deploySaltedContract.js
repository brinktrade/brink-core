const { ethers } = require('hardhat')
const { SINGLETON_FACTORY } = require('../../constants')
const deploySingletonFactory = require('./deploySingletonFactory')
const saltedDeployAddress = require('./saltedDeployAddress')

async function deploySaltedContract (contractName, initParamTypes = [], initParamValues = []) {
  await deploySingletonFactory()

  const SaltedDeployer = await ethers.getContractFactory('SaltedDeployer')
  // doesn't matter what saltedDeployer address is, since SingletonFactory will exec the create2 call
  const saltedDeployer = await SaltedDeployer.deploy()

  const Contract = await ethers.getContractFactory(contractName)
  const { address: address_JS, initCode } = saltedDeployAddress(
    SINGLETON_FACTORY, Contract.bytecode, initParamTypes, initParamValues
  )
  const address_Solidity = await saltedDeployer.getDeployAddress(initCode)

  if (address_JS !== address_Solidity) {
    throw new Error(`deploy ${contractName} failed: JS computed address ${address_JS} does not match Solidity computed address ${address_Solidity}`)
  }

  if (await ethers.provider.getCode(address_Solidity) == '0x') {
    await saltedDeployer.deploy(initCode)
  }

  if (await ethers.provider.getCode(address_Solidity) == '0x') {
    throw new Error(`deploy ${contractName} failed: No contract at expected address ${address_Solidity}`)
  }

  return Contract.attach(address_Solidity)
}

module.exports = deploySaltedContract
