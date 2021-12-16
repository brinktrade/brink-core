const hre = require('hardhat')
const { ethers } = hre
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, encodeFunctionCall } = brinkUtils
const { BN18 } = brinkUtils.constants
const { deployTestTokens } = brinkUtils.testHelpers(ethers)
const {
  getSigners,
  getProxyOwnerAddress,
  randomProxyAccount,
  deployMasterAccount,
  deployAccountFactory,
  snapshotGas
} = require('./helpers')

describe('Proxy (deployed by AccountFactory.sol)', function () {
  beforeEach(async function () {
    const { defaultAccount, proxyOwner_4 } = await getSigners()
    this.defaultAccount = defaultAccount
    this.proxyOwner_4 = proxyOwner_4
    
    await deployMasterAccount()
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
      expect(await getProxyOwnerAddress(this.proxyAccount.address)).to.be.equal(this.proxyOwner.address)
    })

    describe('for owner with leading and trailing zeros in address', function () {
      beforeEach(async function () {
        const { proxyOwner, proxyAccount } = await randomProxyAccount({ leadingZeros: 6, trailingZeros: 6 })
        this.proxyAccount = proxyAccount
        this.proxyOwner = proxyOwner

        await this.accountFactory.deployAccount(this.proxyOwner.address)
      })

      it('should append owner address in deployed bytecode', async function () {
        expect(await getProxyOwnerAddress(this.proxyAccount.address)).to.be.equal(this.proxyOwner.address)
      })

      it('should be able to verify owner from Account implementation', async function () {
        await this.defaultAccount.sendTransaction({
          to: this.proxyOwner.address,
          value: BN(1000).mul(BN18)
        })

        const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls')
        const testAccountCalls = await TestAccountCalls.deploy()
        const testCallsContract = TestAccountCalls.attach(this.proxyAccount.address)

        const promise = this.proxyAccount.connect(this.proxyOwner).delegateCall(
          testAccountCalls.address, encodeFunctionCall('testEvent', ['uint'], [123])
        )
        await expect(promise).to.emit(testCallsContract, 'MockParamEvent').withArgs(123)
      })

      it('should be able to receive ETH', async function () {
        // extra check that owner is read correctly and the delegatecall to fallback receive on implementation succeeds
        const ethSendAmount = BN(3).mul(BN18)
        await this.defaultAccount.sendTransaction({
          to: this.proxyAccount.address,
          value: ethSendAmount
        })
        expect(await ethers.provider.getBalance(this.proxyAccount.address)).to.equal(ethSendAmount)
      })
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

    it('gas cost', async function () {
      this.ethTransferAmount = BN(2).mul(BN18)
      await snapshotGas(this.defaultAccount.sendTransaction({
        to: this.proxyAccount.address,
        value: this.ethTransferAmount
      }))
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
      expect(await getProxyOwnerAddress(this.proxyAccount.address)).to.equal(this.proxyOwner.address)
    })
  })
})
