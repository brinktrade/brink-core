const abi = require('hardhat').ethers.utils.defaultAbiCoder
const { soliditySha3 } = require('web3-utils')

function domainSeparator (chainId, contractAddress) {
  return soliditySha3(abi.encode([
    'bytes32',
    'bytes32',
    'bytes32',
    'uint256',
    'address'
  ], [
    '0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f',
    soliditySha3({ t: 'string', v: 'BrinkAccount' }),
    soliditySha3({ t: 'string', v: '1' }),
    chainId,
    contractAddress
  ]))
}

module.exports = domainSeparator
