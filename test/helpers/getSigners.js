const getSigners = async () => {
  const [
    defaultAccount,
    metaAccountOwner,
    proxyDeployer,
    badAccount,
    transferRecipient,
    ethStoreAccount
  ] = await ethers.getSigners()
  return {
    defaultAccount,
    metaAccountOwner,
    proxyDeployer,
    badAccount,
    transferRecipient,
    ethStoreAccount
  }
}

module.exports = getSigners
