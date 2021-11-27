const { ethers } = require('hardhat')
const { toChecksumAddress } = require('web3-utils')

async function getProxyOwnerAddress (proxyAddress) {
  const proxyDeployedCode = await ethers.provider.getCode(proxyAddress)
  const proxyOwnerAddress = toChecksumAddress(proxyDeployedCode.slice(92, 132))
  return proxyOwnerAddress
}

module.exports = getProxyOwnerAddress
