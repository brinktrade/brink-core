const { ACCOUNT } = require('../../constants')

async function proxyBytecode (proxyOwnerAddress) {
  return '3d603f80600a3d3981f3363d3d373d3d3d363d71'
    + removeLeadingZeros(ACCOUNT.slice(2)).toLowerCase()
    + '5af43d82803e903d91602957fd5bf3'
    + proxyOwnerAddress.slice(2).toLowerCase()
}

const removeLeadingZeros = s => s.replace(/^0+/, '')

module.exports = proxyBytecode
