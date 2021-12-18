const fs = require('fs')
const constants = require('./constants')

const contracts = [
  ['./artifacts/contracts/Account/Account.sol/Account.json', constants.ACCOUNT],
  ['./artifacts/contracts/Account/AccountFactory.sol/AccountFactory.json', constants.ACCOUNT_FACTORY],
  ['./artifacts/contracts/Batched/DeployAndCall.sol/DeployAndCall.json', constants.DEPLOY_AND_CALL],
  ['./artifacts/contracts/Deployers/SaltedDeployer.sol/SaltedDeployer.json', constants.SALTED_DEPLOYER]
]

function generateInterface () {
  let contractsJSON = {}
  for (let i in contracts) {
    const [path, address] = contracts[i]
    const { contractName, abi, bytecode, deployedBytecode } = require(path)
    contractsJSON[contractName] = { address, abi, bytecode, deployedBytecode }
  }
  console.log('Writing index.js file...')
  fs.writeFileSync('./index.js', `module.exports = ${JSON.stringify(contractsJSON, null, 2)}\n`)
  console.log('done')
  console.log()
}

generateInterface()
