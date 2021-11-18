const setupDeployers = async (accountImplementation) => {
  const SingletonFactory = await ethers.getContractFactory('SingletonFactory')
  const singletonFactory = await SingletonFactory.deploy()
  await singletonFactory.deployed()

  const AccountFactory = await ethers.getContractFactory('AccountFactory')
  const accountFactory = await AccountFactory.deploy(accountImplementation.address)

  const DeployAndCall = await ethers.getContractFactory('DeployAndCall')
  const deployAndCall = await DeployAndCall.deploy(accountFactory.address)

  return { singletonFactory, accountFactory, deployAndCall }
}

module.exports = setupDeployers
