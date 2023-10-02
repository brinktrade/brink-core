const getSigners = async () => {
  const [
    defaultAccount,
    transferRecipient,
    ethStoreAccount,
    proxyOwner_1,
    proxyOwner_2,
    proxyOwner_3,
    proxyOwner_4
  ] = await ethers.getSigners()
  return {
    defaultAccount,
    transferRecipient,
    ethStoreAccount,
    proxyOwner_1,
    proxyOwner_2,
    proxyOwner_3,
    proxyOwner_4
  }
}

module.exports = getSigners
