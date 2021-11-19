const { ethers } = require('hardhat')
const saltedDeployAddress = require('./saltedDeployAddress')
const { ACCOUNT_FACTORY } = require('../../constants')

async function proxyAccountFromOwner (proxyOwnerAddress) {
  const Proxy = await ethers.getContractFactory('Proxy')
  const { address: proxyAccountAddress } = saltedDeployAddress(
    ACCOUNT_FACTORY, Proxy.bytecode, ['address'], [proxyOwnerAddress]
  )
  return proxyAccountAddress
}

module.exports = proxyAccountFromOwner
