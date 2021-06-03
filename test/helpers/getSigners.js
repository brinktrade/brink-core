const getSigners = async () => {
  const [
    defaultAccount,
    metaAccountOwner,
    proxyDeployer,
    badAccount,
    transferRecipient
  ] = await ethers.getSigners()
  return {
    defaultAccount,
    metaAccountOwner,
    proxyDeployer,
    badAccount,
    transferRecipient
  }
}

module.exports = getSigners
