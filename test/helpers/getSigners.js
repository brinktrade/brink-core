const getSigners = async () => {
  const [ defaultAccount, metaAccountOwner, proxyDeployer] = await ethers.getSigners()
  return {
    defaultAccount,
    metaAccountOwner,
    proxyDeployer
  }
}

module.exports = getSigners
