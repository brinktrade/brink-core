const { ethers } = require('hardhat')
const snapshot = require('snap-shot-it')
const { expect } = require('chai')
const { ACCOUNT, ACCOUNT_FACTORY, DEPLOY_AND_CALL } = require('../constants')
const { ZERO_ADDRESS } = require('@brinkninja/utils').constants
const {
  deployMasterAccount,
  deployAccountFactory,
  deployDeployAndCall
} = require('./helpers')

describe('Account.sol', function () {
  // check that deployed master Account.sol address matches values in constants, contract code, and snapshot
  it('deterministic address check', async function () {
    const masterAccount = await deployMasterAccount()
    snapshot(masterAccount.address)
    expect(masterAccount.address, 'Deployed account address and ACCOUNT constant are different').to.equal(ACCOUNT)

    const AccountFactory = await ethers.getContractFactory('AccountFactory')
    expect(AccountFactory.bytecode.includes(ACCOUNT.slice(2).toLowerCase()), 'AccountFactory bytecode does not contain masterAccount address. Update `deploy()` to use latest compiled Proxy.sol bytecode').to.be.true
  })
})

describe('AccountFactory.sol', function () {
  // check that deployed AccountFactory.sol address matches values in constants, contract code, and snapshots
  it('deterministic address check', async function () {
    const accountFactory = await deployAccountFactory()
    snapshot(accountFactory.address)
    expect(accountFactory.address, 'Deployed account address and ACCOUNT constant are different').to.equal(ACCOUNT_FACTORY)

    const DeployAndCallWrapper = await ethers.getContractFactory('DeployAndCallWrapper')
    const deployAndCallWrapper = await DeployAndCallWrapper.deploy()
    expect(accountFactory.address, 'Deployed accountFactory address and DeployAndCall ACCOUNT_FACTORY are different').to.equal(await deployAndCallWrapper.accountFactory())
  })
})

describe('DeployAndCall.sol', function () {
  // check that deployed DeployAndCall.sol address matches values in constants, contract code, and snapshots
  it('deterministic address check', async function () {
    const deployAndCall = await deployDeployAndCall()
    snapshot(deployAndCall.address)
    expect(deployAndCall.address, 'Deployed DeployAndCall address and DEPLOY_AND_CALL constant are different').to.equal(DEPLOY_AND_CALL)
  })
})