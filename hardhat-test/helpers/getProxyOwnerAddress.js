const { ethers } = require('hardhat')
const { toChecksumAddress } = require('web3-utils')

async function getProxyOwnerAddress (proxyAddress) {
  const proxyDeployedCode = await ethers.provider.getCode(proxyAddress)
  const ownerAddressIndex = proxyDeployedCode.length - 40
  const proxyOwnerAddress = toChecksumAddress(proxyDeployedCode.slice(ownerAddressIndex, proxyDeployedCode.length))
  return proxyOwnerAddress
}

module.exports = getProxyOwnerAddress
