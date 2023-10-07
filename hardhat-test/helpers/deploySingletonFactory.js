const { ethers } = require('hardhat')
const brinkUtils = require('@brinkninja/utils')
const { BN } = brinkUtils
const { BN14 } = brinkUtils.constants
const { SINGLETON_FACTORY } = require('../../constants')

// Single-use factory deployment technique from https://eips.ethereum.org/EIPS/eip-2470
// Originally described in https://weka.medium.com/how-to-send-ether-to-11-440-people-187e332566b7
// The raw tx deploys SingletonFactory from `0xBb6e024b9cFFACB947A71991E386681B1Cd1477D` which needs exactly 0.0247 ETH.
// Resulting tx hash is always `0x803351deb6d745e91545a6a3e1c0ea3e9a6a02a1a4193b70edfcd2f40f71a01c` and the contract
// always deploys to `0xce0042B868300000d44A59004Da54A005ffdcf9f`
async function deploySingletonFactory () {
  const defaultAccount = (await ethers.getSigners())[0]

  if (await ethers.provider.getCode(SINGLETON_FACTORY) == '0x') { // only deploy if it doesn't already exist
    await defaultAccount.sendTransaction({
      to: _singleUseDeployerAddress,
      value: BN(247).mul(BN14)
    })

    const tx = await ethers.provider.sendTransaction(_rawSingletonFactoryDeployTx)
    if (await ethers.provider.getCode(SINGLETON_FACTORY) == '0x' || tx.hash !== _expectedTxHash) {
      throw new Error(`SingletonFactory deploy failed`)
    }
  }

  const singletonFactory = new ethers.Contract(SINGLETON_FACTORY, _singletonFactoryABI, defaultAccount)
  return singletonFactory
}

const _singleUseDeployerAddress = '0xBb6e024b9cFFACB947A71991E386681B1Cd1477D'

const _rawSingletonFactoryDeployTx = '0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470'

const _expectedTxHash = '0x803351deb6d745e91545a6a3e1c0ea3e9a6a02a1a4193b70edfcd2f40f71a01c'

const _singletonFactoryABI = [
  {
      "constant": false,
      "inputs": [
          {
              "internalType": "bytes",
              "name": "_initCode",
              "type": "bytes"
          },
          {
              "internalType": "bytes32",
              "name": "_salt",
              "type": "bytes32"
          }
      ],
      "name": "deploy",
      "outputs": [
          {
              "internalType": "address payable",
              "name": "createdContract",
              "type": "address"
          }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  }
]

module.exports = deploySingletonFactory
