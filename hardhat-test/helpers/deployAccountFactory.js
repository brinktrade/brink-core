const deploySaltedContract = require('./deploySaltedContract')

async function deployAccountFactory () {
  const accountFactory = await deploySaltedContract('AccountFactory')
  return accountFactory
}

module.exports = deployAccountFactory
