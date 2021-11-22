const deploySaltedContract = require('./deploySaltedContract')

async function deployMasterAccount () {
  const account = await deploySaltedContract('Account', [], [])
  return account
}

module.exports = deployMasterAccount
