const fs = require('fs')
const { ethers } = require('hardhat')
const { soliditySha3, toChecksumAddress, padLeft } = require('web3-utils')
const { SINGLETON_FACTORY } = require('./constants')

// runVanityGenerator() looks for an address for Account.sol with leading zeros.
// It increments salt from `start`, start can be set to start at 0 or any int.
// Salts are logged to .salt_log file every `logInterval` tries, so we know how many have been checked.
// When a match is found, it console logs the address and salt.
// It also logs number of tries it took to find, and compares that to expected probability

async function runVanityGenerator () {
  const AccountBytecode = (await ethers.getContractFactory('Account')).bytecode
  const codeHash = soliditySha3({ t: 'bytes', v: AccountBytecode })

  function getDeployAddress(int) {
    const salt = `0x${padLeft(int.toString(16), 64)}`
    const addressAsBytes32 = soliditySha3(
      { t: 'uint8', v: 255 }, // 0xff
      { t: 'address', v: SINGLETON_FACTORY },
      { t: 'bytes32', v: salt },
      { t: 'bytes32', v: codeHash }
    )
    return {
      address: toChecksumAddress(`0x${addressAsBytes32.slice(26,66)}`),
      salt
    }
  }

  const start = 0
  const prefix = '0000'
  const prefixSlice = 2 + prefix.length
  const expectedTries = 16**prefix.length
  const logInterval = 100000

  let lastLogged = start
  let lastFound = start

  for (let i = start; i < Infinity; i++) {
    const { address, salt } = getDeployAddress(i)
    if (address.slice(2, prefixSlice) == prefix) {
      const tries = i-lastFound
      lastFound = i
      console.log(`FOUND: ${address}: ${salt}`)
      console.log(`   tries: ${tries} | ${tries/expectedTries*100}% of expected`)
      console.log()
    }
    if (i - lastLogged > logInterval) {
      fs.writeFileSync('.salt_log', `${Date.now()}: ${i}: ${salt}`, err => console.log(err))
      lastLogged = i
    }
  }
}

runVanityGenerator()
