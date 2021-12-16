const saltedDeployAddress = require('./saltedDeployAddress')
const proxyBytecode = require('./proxyBytecode')
const { ACCOUNT_FACTORY, PROXY_DEPLOY_SALT } = require('../../constants')

async function proxyAccountFromOwner (proxyOwnerAddress) {
  const { address: proxyAccountAddress } = saltedDeployAddress(
    ACCOUNT_FACTORY, PROXY_DEPLOY_SALT, await proxyBytecode(proxyOwnerAddress), [], []
  )
  return proxyAccountAddress
}

module.exports = proxyAccountFromOwner
