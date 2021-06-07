const { ethers } = require('hardhat')
const {
  BN, BN18,
  chaiSolidity,
  deployTestTokens,
  encodeFunctionCall,
  splitCallData,
  randomAddress,
  execMetaTx,
  metaTxPromise,
  ZERO_ADDRESS
} = require('@brinkninja/test-helpers')
const { setupMetaAccount, getSigners } = require('./helpers')
const { expect } = chaiSolidity()

describe('Account', function () {
  beforeEach(async function () {
    const { defaultAccount, metaAccountOwner } = await getSigners()
    this.defaultAccount = defaultAccount
    this.metaAccountOwner = metaAccountOwner
    this.transferRecipient = await randomAddress()

    const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls')
    this.testAccountCalls = await TestAccountCalls.deploy()

    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount
  })

  describe('sending ETH to account address', function () {
    beforeEach(async function () {
      this.ethSendAmount = BN(3).mul(BN18)
      
      await this.defaultAccount.sendTransaction({
        to: this.metaAccount.address,
        value: this.ethSendAmount
      })
    })

    it('should succeed and increase account balance', async function () {
      expect(await ethers.provider.getBalance(this.metaAccount.address)).to.equal(this.ethSendAmount)
    })
  })

  describe('externalCall()', async function() {
    beforeEach(async function () {
      const { tokenA } = await deployTestTokens()
      this.tokenA = tokenA
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

    it('call from non-owner should revert with \'NOT_OWNER\'', async function() {
      await expect(
        this.metaAccount.connect(this.defaultAccount).externalCall(0, ZERO_ADDRESS, this.tknTransferCall)
      ).to.be.revertedWith('NOT_OWNER');
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

    it('when call reverts, externalCall should revert', async function () {
      await expect(this.metaAccount.connect(this.metaAccountOwner).externalCall(
        0,
        this.tokenA.address,
        encodeFunctionCall(
          'transfer',
          ['address', 'uint'],
          [this.transferRecipient.address, this.tknAmt.add(1).toString()] // transfer too much
        )
      )).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })
  })

  describe('delegateCall()', async function() {
    beforeEach(async function () {
      const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls');
      this.testAccountCalls = await TestAccountCalls.deploy()
      this.mockUint = BN18
      this.mockInt = -12345
      this.mockAddress = (await randomAddress()).address
      this.testCall = encodeFunctionCall(
        'testEvent',
        ['uint', 'int24', 'address'],
        [this.mockUint, this.mockInt, this.mockAddress]
      )
    })
    it('call from account owner should execute delegatecall on external contract', async function() {
      const promise = this.metaAccount.connect(this.metaAccountOwner).delegateCall(this.testAccountCalls.address, this.testCall)
      await expect(promise)
                .to.emit(this.metaAccount, 'MockParamsEvent')
                .withArgs(this.mockUint, this.mockInt, this.mockAddress)
    })

    it('call from non-owner should revert with \'NOT_OWNER\'', async function() {
      const { defaultAccount } = await getSigners()
      await expect(
        this.metaAccount.connect(defaultAccount).delegateCall(this.testAccountCalls.address, this.testCall)
      ).to.be.revertedWith('NOT_OWNER');
    })

    it('when call reverts, delegateCall should revert', async function () {
      await expect(this.metaAccount.connect(this.metaAccountOwner).externalCall(
        0,
        this.testAccountCalls.address,
        encodeFunctionCall('testRevert', ['bool'], [true])
      )).to.be.revertedWith('TestAccountCalls: reverted')
    })
  })

  describe('metaCall()', function () {
    beforeEach(async function () {
      const { tokenA } = await deployTestTokens()
      this.tokenA = tokenA
      this.transferAmount = BN(2).mul(BN18)
    })

    it('when signer is proxy owner, should execute the call', async function () {
      await this.tokenA.mint(this.metaAccount.address, this.transferAmount)
      await execMetaTx({
        contract: this.metaAccount,
        method: 'metaCall',
        signer: this.metaAccountOwner,
        params: [
          0,
          this.tokenA.address,
          encodeFunctionCall(
            'transfer',
            ['address', 'uint'],
            [this.transferRecipient.address, this.transferAmount.toString()]
          )
        ]
      })
      expect(await this.tokenA.balanceOf(this.transferRecipient.address)).to.equal(this.transferAmount)
    })

    it('when signer is not proxy owner, should revert with \'NOT_OWNER\'', async function () {
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaCall',
        signer: this.defaultAccount,
        params: [
          0,
          this.tokenA.address,
          encodeFunctionCall(
            'transfer',
            ['address', 'uint'],
            [this.transferRecipient.address, this.transferAmount.toString()]
          )
        ]
      })).to.be.revertedWith('NOT_OWNER')
    })

    it('when value param is greater than zero, should transfer ETH with the call', async function () {
      await this.defaultAccount.sendTransaction({
        to: this.metaAccount.address,
        value: this.transferAmount
      })
      await execMetaTx({
        contract: this.metaAccount,
        method: 'metaCall',
        signer: this.metaAccountOwner,
        params: [ this.transferAmount, this.transferRecipient.address, '0x' ]
      })
      expect(await ethers.provider.getBalance(this.transferRecipient.address)).to.equal(this.transferAmount)
    })

    it('when call reverts, metaCall should revert', async function () {
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaCall',
        signer: this.metaAccountOwner,
        params: [0, this.testAccountCalls.address, encodeFunctionCall('testRevert', ['bool'], [true])]
      })).to.be.revertedWith('TestAccountCalls: reverted')
    })
  })

  describe('metaDelegateCall()', function () {
    beforeEach(async function () {
      this.mockUint = BN(12345)
    })

    it('when signer is proxy owner, should execute the delegatecall', async function () {
      const { promise } = await metaTxPromise({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.metaAccountOwner,
        params: [
          this.testAccountCalls.address,
          encodeFunctionCall('testEvent', ['uint'], [this.mockUint.toString()])
        ]
      })
      await expect(promise).to.emit(this.metaAccount, 'MockParamEvent').withArgs(this.mockUint)
    })

    it('when signer is not proxy owner, should revert with NOT_OWNER', async function () {
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.defaultAccount,
        params: [
          this.testAccountCalls.address,
          encodeFunctionCall('testEvent', ['uint'], [this.mockUint.toString()])
        ]
      })).to.be.revertedWith('NOT_OWNER')
    })

    it('when call reverts, metaDelegateCall should revert', async function () {
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.metaAccountOwner,
        params: [this.testAccountCalls.address, encodeFunctionCall('testRevert', ['bool'], [true])]
      })).to.be.revertedWith('TestAccountCalls: reverted')
    })
  })

  describe('metaPartialSignedDelegateCall()', function () {
    beforeEach(async function () {
      this.mockUint = BN(12345)
      this.mockInt = BN(-6789)
      this.mockAddress = (await randomAddress()).address
    })

    it('when signer is proxy owner, should execute the delegatecall', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testEvent',
        ['uint256', 'int24', 'address'],
        [ this.mockUint.toString(), this.mockInt, this.mockAddress ]
      ), 1)
      const { promise } = await metaTxPromise({
        contract: this.metaAccount,
        method: 'metaPartialSignedDelegateCall',
        signer: this.metaAccountOwner,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData
      })
      await expect(promise).to.emit(this.metaAccount, 'MockParamsEvent')
        .withArgs(this.mockUint, this.mockInt, this.mockAddress)
    })

    it('when signer is not proxy owner, should revert with NOT_OWNER', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testEvent',
        ['uint256', 'int24', 'address'],
        [ this.mockUint.toString(), this.mockInt, this.mockAddress ]
      ), 1)
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaPartialSignedDelegateCall',
        signer: this.defaultAccount,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData
      })).to.be.revertedWith('NOT_OWNER')
    })

    it('when call reverts, metaPartialSignedDelegateCall should revert', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testRevert', ['bool'], [true ]
      ), 0)
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaPartialSignedDelegateCall',
        signer: this.metaAccountOwner,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData
      })).to.be.revertedWith('TestAccountCalls: reverted')
    })
  })
})
