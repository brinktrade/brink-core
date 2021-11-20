const { ethers } = require('hardhat')
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, encodeFunctionCall } = brinkUtils
const { BN18 } = brinkUtils.constants
const { deployTestTokens } = brinkUtils.testHelpers(ethers)
const { SINGLETON_FACTORY, ACCOUNT } = require('../constants')
const {
  getSigners,
  randomProxyAccount,
  deployMasterAccount,
  deployAccountFactory,
  saltedDeployAddress,
  snapshotGas
} = require('./helpers')

const chainId = 1

describe('Proxy', function () {
  beforeEach(async function () {
    const { defaultAccount, proxyOwner_4 } = await getSigners()
    this.defaultAccount = defaultAccount
    this.proxyOwner_4 = proxyOwner_4
    
    await deployMasterAccount(chainId)
    this.accountFactory = await deployAccountFactory();

    const { proxyOwner, proxyAccount } = await randomProxyAccount()
    this.proxyOwner = proxyOwner
    this.proxyAccount = proxyAccount

    await this.accountFactory.deployAccount(this.proxyOwner.address)
  })

  describe('when proxy is deployed', function () {
    it('new proxy contract code should be stored at the predeployed computed address', async function () {
      expect(await ethers.provider.getCode(this.proxyAccount.address)).to.not.equal('0x')
    })

    it('should set proxyOwner', async function () {
      expect(await this.proxyAccount.proxyOwner()).to.be.equal(this.proxyOwner.address)
    })

    it('gas cost', async function () {
      // use deterministic proxyOwner address for snapshot, so gas cost is fixed
      await snapshotGas(this.accountFactory.deployAccount(this.proxyOwner_4.address))
    })
  })

  describe('when Proxy account receives ETH', function () {
    it('should send Eth to the account', async function () {
      this.ethTransferAmount = BN(2).mul(BN18)
      await this.defaultAccount.sendTransaction({
        to: this.proxyAccount.address,
        value: this.ethTransferAmount
      })
      expect(await ethers.provider.getBalance(this.proxyAccount.address)).to.equal(this.ethTransferAmount)
    })
  })

  describe('when Proxy account receives ERC20', function () {
    it('should send ERC20 to the account', async function () {
      const { tokenA } = await deployTestTokens()
      this.tokenA = tokenA
      this.tokenTransferAmount = BN(2).mul(BN18)
      await this.tokenA.mint(this.defaultAccount.address, this.tokenTransferAmount)
      await this.tokenA.transfer(this.proxyAccount.address, this.tokenTransferAmount)
      expect(await this.tokenA.balanceOf(this.proxyAccount.address)).to.equal(this.tokenTransferAmount)
    })
  })

  describe('when memory slots are overwritten', function () {
    beforeEach(async function () {
      const MemorySlotOverwrite = await ethers.getContractFactory('MemorySlotOverwrite')
      const memorySlotOverwrite = await MemorySlotOverwrite.deploy()
      await this.proxyAccount.connect(this.proxyOwner).delegateCall(
        memorySlotOverwrite.address,
        encodeFunctionCall('overwrite', [], [])
      )
    })

    it('should not affect owner address', async function () {
      expect(await this.proxyAccount.proxyOwner()).to.equal(this.proxyOwner.address)
    })
  })
})
