const deploySaltedContract = require('./deploySaltedContract')

const chainId = 1

async function deployMasterAccount () {
  const account = await deploySaltedContract('Account', ['uint256'], [chainId])
  return account
}

module.exports = deployMasterAccount
