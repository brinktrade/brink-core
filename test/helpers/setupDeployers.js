const singletonFactoryContract = require('./singletonFactory/singletonFactoryContract')

const setupDeployers = async () => {
  const SingletonFactory = await singletonFactoryContract()
  const singletonFactory = await SingletonFactory.deploy()
  await singletonFactory.deployed()

  const SingletonFactoryCaller = await ethers.getContractFactory('SingletonFactoryCaller')
  const singletonFactoryCaller = await SingletonFactoryCaller.deploy(singletonFactory.address) 

  const DeployAndExecute = await ethers.getContractFactory('DeployAndExecute')
  const deployAndExecute = await DeployAndExecute.deploy(singletonFactory.address)

  return { singletonFactory, singletonFactoryCaller, deployAndExecute }
}

module.exports = setupDeployers
