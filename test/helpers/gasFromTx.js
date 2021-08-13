const { ethers } = require('hardhat')

async function gasFromTx (tx) {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
  return receipt.gasUsed.toNumber()
}

module.exports = gasFromTx
