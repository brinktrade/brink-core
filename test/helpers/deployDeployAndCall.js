const deploySaltedContract = require('./deploySaltedContract')

async function deployDeployAndCall () {
  const deployAndCall = await deploySaltedContract('DeployAndCall')
  return deployAndCall
}

module.exports = deployDeployAndCall
