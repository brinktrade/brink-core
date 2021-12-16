const saltedDeployAddress = require('./saltedDeployAddress')
const proxyBytecode = require('./proxyBytecode')
const { ACCOUNT_FACTORY } = require('../../constants')

async function proxyAccountFromOwner (proxyOwnerAddress) {
  const { address: proxyAccountAddress } = saltedDeployAddress(
    ACCOUNT_FACTORY, '0x', await proxyBytecode(proxyOwnerAddress), [], []
  )
  return proxyAccountAddress
}

module.exports = proxyAccountFromOwner
