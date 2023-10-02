const { ethers } = require('hardhat')
const deploySaltedBytecode = require('./deploySaltedBytecode')

async function deploySaltedContract (contractName, initParamTypes = [], initParamValues = []) {
  const Contract = await ethers.getContractFactory(contractName)
  const deployedAddress = await deploySaltedBytecode(Contract.bytecode, initParamTypes, initParamValues)
  return Contract.attach(deployedAddress)
}

module.exports = deploySaltedContract
