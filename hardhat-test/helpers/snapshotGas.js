const snapshot = require('snap-shot-it')
const gasFromTx = require('./gasFromTx')

async function snapshotGas (promise) {
  const tx = await promise
  const gasUsed = await gasFromTx(tx)
  snapshot(gasUsed)
}

module.exports = snapshotGas
