const setupDeployers = async () => {
  const SingletonFactory = await ethers.getContractFactory('SingletonFactory')
  const singletonFactory = await SingletonFactory.deploy()
  await singletonFactory.deployed()

  const DeployAndExecute = await ethers.getContractFactory('DeployAndExecute')
  const deployAndExecute = await DeployAndExecute.deploy(singletonFactory.address)

  return { singletonFactory, deployAndExecute }
}

module.exports = setupDeployers
