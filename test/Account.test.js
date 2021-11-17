const { ethers } = require('hardhat')
const { soliditySha3 } = require('web3-utils')
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, encodeFunctionCall, splitCallData } = brinkUtils
const { ZERO_ADDRESS, BN18 } = brinkUtils.constants
const {
  deployTestTokens,
  execMetaTx,
  metaTxPromise
} = brinkUtils.testHelpers(ethers)
const {
  setupMetaAccount,
  setupContractOwnedAccount,
  metaCallDataHash,
  getSigners,
  snapshotGas
} = require('./helpers')

// keccak256("MetaDelegateCall_EIP1271(address to,bytes data)")
const META_DELEGATE_CALL_EIP1271_TYPEHASH = '0x1d3b50d88adeb95016e86033ab418b64b7ecd66b70783b0dca7b0afc8bfb8a1e'

describe('Account', function () {
  beforeEach(async function () {
    const { defaultAccount, metaAccountOwner } = await getSigners()
    this.defaultAccount = defaultAccount
    this.metaAccountOwner = metaAccountOwner
    this.transferRecipientAddress = '0xaff9aeda442C8D27a7F01490CA520dbdf088d1a2'

    const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls')
    this.testAccountCalls = await TestAccountCalls.deploy()


    const TestEmptyCall = await ethers.getContractFactory('TestEmptyCall')
    this.testEmptyCall = await TestEmptyCall.deploy()
    this.emptyCallAddress = this.testEmptyCall.address
    this.emptyCallData = encodeFunctionCall('testEmpty', [], [])
  })

  describe('sending ETH to account address', function () {
    beforeEach(async function () {
      const { metaAccount } = await setupMetaAccount()
      this.metaAccount = metaAccount

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
      const { metaAccount } = await setupMetaAccount()
      this.metaAccount = metaAccount

      const { tokenA } = await deployTestTokens()
      this.tokenA = tokenA
      this.tknAmt = BN18.mul(2)
      await this.tokenA.mint(this.metaAccount.address, this.tknAmt)
      this.tknTransferCall = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [this.transferRecipientAddress, this.tknAmt.toString()]
      )
    })
    it('call from account owner should call external contract', async function() {
      // testing this with an ERC20.transfer() call
      await this.metaAccount.connect(this.metaAccountOwner).externalCall(0, this.tokenA.address, this.tknTransferCall)
      expect(await this.tokenA.balanceOf(this.metaAccount.address)).to.equal(0)
      expect(await this.tokenA.balanceOf(this.transferRecipientAddress)).to.equal(this.tknAmt)
    })

    it('call from non-owner should revert with \'NOT_OWNER\'', async function() {
      await expect(
        this.metaAccount.externalCall(0, ZERO_ADDRESS, this.tknTransferCall)
      ).to.be.revertedWith('NOT_OWNER');
    })

    it('call from account owner with value and 0x data should send ETH', async function() {
      const initalBalance = await ethers.provider.getBalance(this.transferRecipientAddress)
      await this.defaultAccount.sendTransaction({
        to: this.metaAccount.address,
        value: 1000000
      })
      await this.metaAccount.connect(this.metaAccountOwner).externalCall(100, this.transferRecipientAddress, '0x')
      const newBalance = await ethers.provider.getBalance(this.transferRecipientAddress)
      expect(BN(newBalance) > BN(initalBalance))
    })

    it('when call reverts, externalCall should revert', async function () {
      await expect(this.metaAccount.connect(this.metaAccountOwner).externalCall(
        0,
        this.tokenA.address,
        encodeFunctionCall(
          'transfer',
          ['address', 'uint'],
          [this.transferRecipientAddress, this.tknAmt.add(1).toString()] // transfer too much
        )
      )).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('gas cost', async function () {
      await snapshotGas(this.metaAccount.connect(this.metaAccountOwner).externalCall(0, this.emptyCallAddress, this.emptyCallData))
    })
  })

  describe('delegateCall()', async function() {
    beforeEach(async function () {
      const { metaAccount } = await setupMetaAccount()
      this.metaAccount = metaAccount

      const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls');
      this.testAccountCalls = await TestAccountCalls.deploy()
      this.mockUint = BN18
      this.mockInt = -12345
      this.mockAddress = '0x26828defe92D67a291995A66d0442C4A3Bca5b12'
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

    it('gas cost', async function () {
      await snapshotGas(this.metaAccount.connect(this.metaAccountOwner).delegateCall(this.emptyCallAddress, this.emptyCallData))
    })
  })

  describe('storageLoad()', function () {

    beforeEach(async function () {
      const { metaAccount } = await setupMetaAccount()
      this.metaAccount = metaAccount
    })

    it('should return the storage value at the given pointer', async function () {
      const inputVal = 123456

      // store the input value
      await this.metaAccount.connect(this.metaAccountOwner).delegateCall(
        this.testAccountCalls.address,
        encodeFunctionCall('testStore', ['uint'], [inputVal])
      )

      // read the value with storageLoad view function
      const outputVal = await this.metaAccount.storageLoad(soliditySha3('mockUint'))
      expect(BN(outputVal)).to.equal(BN(inputVal))
    })
  })

  describe('metaDelegateCall()', function () {
    beforeEach(async function () {
      const { metaAccount } = await setupMetaAccount()
      this.metaAccount = metaAccount

      this.mockUint = BN(12345)
      this.mockInt = BN(-6789)
      this.mockAddress = '0xf312da71C80381C393fbbD48BBDb52e91c69a322'
    })

    it('when signer is proxy owner, should execute the delegatecall', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testEvent',
        ['uint256', 'int24', 'address'],
        [ this.mockUint.toString(), this.mockInt, this.mockAddress ]
      ), 1)
      const { promise } = await metaTxPromise({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.metaAccountOwner,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData
      })
      await expect(promise).to.emit(this.metaAccount, 'MockParamsEvent')
        .withArgs(this.mockUint, this.mockInt, this.mockAddress)
    })

    it('when sent with a valid signature and call data to a function that does not expect appended unsigned data', async function () {
      const { promise } = await metaTxPromise({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.metaAccountOwner,
        params: [
          this.testAccountCalls.address,
          encodeFunctionCall('testEvent', ['uint'], [this.mockUint.toString()])
        ],
        unsignedData: '0x'
      })
      await expect(promise).to.emit(this.metaAccount, 'MockParamEvent').withArgs(this.mockUint)
    })

    it('when signer is not proxy owner, should revert with NOT_OWNER', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testEvent',
        ['uint256', 'int24', 'address'],
        [ this.mockUint.toString(), this.mockInt, this.mockAddress ]
      ), 1)
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.defaultAccount,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData
      })).to.be.revertedWith('NOT_OWNER')
    })

    it('when call reverts, metaDelegateCall should revert', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testRevert', ['bool'], [true ]
      ), 0)
      await expect(execMetaTx({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.metaAccountOwner,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData
      })).to.be.revertedWith('TestAccountCalls: reverted')
    })

    it('gas cost', async function () {
      const { promise } = await metaTxPromise({
        contract: this.metaAccount,
        method: 'metaDelegateCall',
        signer: this.metaAccountOwner,
        params: [
          this.emptyCallAddress,
          this.emptyCallData
        ],
        unsignedData: '0x'
      })
      await snapshotGas(promise)
    })
  })

  describe('metaDelegateCall_EIP1271()', function () {
    beforeEach(async function () {
      const { contractOwnedAccount, proxyOwner } = await setupContractOwnedAccount()
      this.contractOwnedAccount = contractOwnedAccount
      this.proxyOwner = proxyOwner

      this.mockUint = BN(12345)
      this.mockUint2 = BN(6789)

      // these are just random hex data
      this.validMockSignature = '0x6578c0ff9e2bebf086f8048d77e4bde3d6f7af7910b6ec0ba6b6b3308155a36ce1ca8f5f0ecacd678668b751c1737040c0b9d9d106cd5564e35c12daa0a891fd06'
      this.invalidMockSignature = '0x0283e7dd0f00ba5fdf9a44b954777d45015b971d85288932afac977b33a742061017df511a0041bacbd255be4f82f16f2d61b629269dcfbe41557a132c5dcd4bdf'

      this.validCallData = encodeFunctionCall(
        'testEvent',
        ['uint256'],
        [ this.mockUint.toString() ]
      )
      this.validCallDataHash = metaCallDataHash({
        metaCallTypeHash: META_DELEGATE_CALL_EIP1271_TYPEHASH,
        to: this.testAccountCalls.address,
        data: this.validCallData
      })

      this.invalidCallData = encodeFunctionCall(
        'testEvent',
        ['uint256'],
        [ this.mockUint2.toString() ]
      )

      // The validity of the hash and signature are mocked by storing them in the proxyOwner contract, which will check
      // that they exist using it's implementation of `isValidSignature`.
      // For the purposes of these tests, the mock signature could be any arbitrary bytes data
      await this.proxyOwner.setValidSignature(this.validCallDataHash, this.validMockSignature)
    })

    it('when proxyOwner validates that the call is signed, should execute the delegatecall', async function () {
        const promise = this.contractOwnedAccount.metaDelegateCall_EIP1271(
          this.testAccountCalls.address, this.validCallData, this.validMockSignature, '0x'
        )
        await expect(promise).to.emit(this.contractOwnedAccount, 'MockParamEvent').withArgs(this.mockUint)
      }
    )

    it('when proxyOwner validation check for the call fails, should revert with \'INVALID_SIGNATURE\'', async function () {
        const promise = this.contractOwnedAccount.metaDelegateCall_EIP1271(
          this.testAccountCalls.address, this.invalidCallData, this.invalidMockSignature, '0x'
        )
        await expect(promise).to.be.revertedWith('INVALID_SIGNATURE');
      }
    )

    it('gas cost', async function () {
      const promise = this.contractOwnedAccount.metaDelegateCall_EIP1271(
        this.testAccountCalls.address, this.validCallData, this.validMockSignature, '0x'
      )
      await snapshotGas(promise)
    })
  })
})
