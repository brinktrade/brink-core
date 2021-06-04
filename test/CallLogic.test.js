const { ethers } = require('hardhat')
const {
  BN, BN18,
  chaiSolidity,
  deployTestTokens,
  encodeFunctionCall,
  randomAddress,
  ZERO_ADDRESS
} = require('@brinkninja/test-helpers')
const { getSigners, setupMetaAccount } = require('./helpers')
const { expect } = chaiSolidity()

describe('CallLogic', function() {
  beforeEach(async function () {
    const { defaultAccount, metaAccountOwner, transferRecipient } = await getSigners()
    this.defaultAccount = defaultAccount
    this.metaAccountOwner = metaAccountOwner
    this.transferRecipient = transferRecipient

    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount

    const TestDelegated = await ethers.getContractFactory('TestDelegated');
    this.testDelegated = await TestDelegated.deploy()

    const { tokenA } = await deployTestTokens()
    this.tokenA = tokenA

    this.mockUint = BN18
    this.mockInt = -12345
    this.mockAddress = (await randomAddress()).address
    this.testCall = encodeFunctionCall(
      'testEvent',
      ['uint', 'int24', 'address'],
      [this.mockUint, this.mockInt, this.mockAddress]
    )
  })
  describe('delegateCall', async function() {
    it('call from account owner should execute delegatecall on external contract', async function() {
      const promise = this.metaAccount.connect(this.metaAccountOwner).delegateCall(this.testDelegated.address, this.testCall)
      await expect(promise)
                .to.emit(this.metaAccount, 'MockParamsEvent')
                .withArgs(this.mockUint, this.mockInt, this.mockAddress)
    });

    it('call from non-owner should revert with \'delegateCall msg.sender is not proxyOwner\'', async function() {
      const { defaultAccount } = await getSigners()
      await expect(
        this.metaAccount.connect(defaultAccount).delegateCall(this.testDelegated.address, this.testCall)
      ).to.be.revertedWith('delegateCall msg.sender is not proxyOwner');
    })
  })
  describe('externalCall', async function() {
    beforeEach(async function () {
      this.tknAmt = BN18.mul(2)
      await this.tokenA.mint(this.metaAccount.address, this.tknAmt)
      this.tknTransferCall = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [this.transferRecipient.address, this.tknAmt.toString()]
      )
    })
    it('call from account owner should call external contract', async function() {
      // testing this with an ERC20.transfer() call
      await this.metaAccount.connect(this.metaAccountOwner).externalCall(0, this.tokenA.address, this.tknTransferCall)
      expect(await this.tokenA.balanceOf(this.metaAccount.address)).to.equal(0)
      expect(await this.tokenA.balanceOf(this.transferRecipient.address)).to.equal(this.tknAmt)
    })

    it('call from non-owner should revert with \'CallLogic: externalCall msg.sender is not proxyOwner\'', async function() {
      await expect(
        this.metaAccount.connect(this.defaultAccount).externalCall(0, ZERO_ADDRESS, this.tknTransferCall)
      ).to.be.revertedWith('CallLogic: externalCall msg.sender is not proxyOwner');
    })

    it('call from account owner with value and 0x data should send ETH', async function() {
      const initalBalance = await ethers.provider.getBalance(this.transferRecipient.address)
      await this.defaultAccount.sendTransaction({
        to: this.metaAccount.address,
        value: 1000000
      })
      await this.metaAccount.connect(this.metaAccountOwner).externalCall(100, this.transferRecipient.address, '0x')
      const newBalance = await ethers.provider.getBalance(this.transferRecipient.address)
      expect(BN(newBalance) > BN(initalBalance))
    })
  })
})