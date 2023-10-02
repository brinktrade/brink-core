const abi = require('hardhat').ethers.utils.defaultAbiCoder
const { soliditySha3 } = require('web3-utils')

function metaCallDataHash ({ metaCallTypeHash, to, data }) {
  return soliditySha3(abi.encode([
    'bytes32',
    'address',
    'bytes32'
  ], [
    metaCallTypeHash,
    to,
    soliditySha3(data)
  ]))
}

module.exports = metaCallDataHash
