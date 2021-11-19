const { ethers } = require('hardhat')
const { expect } = require('chai')
const { toChecksumAddress } = require('web3-utils')
const {
  deployMasterAccount,
  deployAccountFactory,
  randomProxyAccount,
  snapshotGas
} = require('./helpers')

const chainId = 1

describe('AccountFactory', function () {
  beforeEach(async function () {
    const [defaultAccount, proxyOwner_2] = await ethers.getSigners()
    this.defaultAccount = defaultAccount
    this.proxyOwner_2 = proxyOwner_2
    
    await deployMasterAccount(chainId)
    this.accountFactory = await deployAccountFactory()

    const { proxyOwner, proxyAccount } = await randomProxyAccount()
    this.proxyOwner = proxyOwner
    this.proxyAccount = proxyAccount
  })

  describe('deployAccount()', function () {
    it('should deploy the account', async function () {
      await this.accountFactory.deployAccount(this.proxyOwner.address)
      expect(await ethers.provider.getCode(this.proxyAccount.address)).to.not.equal('0x')
    })

    it('should emit an AccountDeployed() event with account address param', async function () {
      const promise = this.accountFactory.deployAccount(this.proxyOwner.address)
      await expect(promise)
              .to.emit(this.accountFactory, 'AccountDeployed')
              .withArgs(toChecksumAddress(this.proxyAccount.address))
    })

    it('gas cost', async function () {
      await snapshotGas(this.accountFactory.deployAccount(this.proxyOwner_2.address))
    })
  })
})