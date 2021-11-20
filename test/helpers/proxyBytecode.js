const { ethers } = require('hardhat')

async function proxyBytecode (proxyOwnerAddress) {
  const Proxy = await ethers.getContractFactory('Proxy')
  return Proxy.bytecode.replace(
    'fefefefefefefefefefefefefefefefefefefefe',
    proxyOwnerAddress.slice(2).toLowerCase()
  )
}

module.exports = proxyBytecode
