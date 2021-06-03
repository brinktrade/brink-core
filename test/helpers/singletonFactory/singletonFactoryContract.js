const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

const singletonFactoryAbiPath = path.join(__dirname, 'SingletonFactory.json')
const singletonFactoryBytecodePath = path.join(__dirname, 'SingletonFactory')

const singletonFactoryAbi = JSON.parse(fs.readFileSync(singletonFactoryAbiPath, 'utf8'))
const singletonFactoryBytecode = fs.readFileSync(singletonFactoryBytecodePath, 'utf8')

module.exports = async () => {
  const [signer] = await ethers.getSigners()
  return new ethers.ContractFactory(singletonFactoryAbi, singletonFactoryBytecode, signer)
}
