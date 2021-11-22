const { ethers } = require('hardhat')
const { soliditySha3 } = require('web3-utils')
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, encodeFunctionCall, splitCallData, encodedParams } = brinkUtils
const { ZERO_ADDRESS, BN18 } = brinkUtils.constants
const {
  deployTestTokens,
  execMetaTx,
  metaTxPromise
} = brinkUtils.testHelpers(ethers)
const {
  deployMasterAccount,
  setupProxyAccount,
  setupContractOwnedAccount,
  metaCallDataHash,
  getSigners,
  snapshotGas
} = require('./helpers')

// keccak256("MetaDelegateCall_EIP1271(address to,bytes data)")
const META_DELEGATE_CALL_EIP1271_TYPEHASH = '0x1d3b50d88adeb95016e86033ab418b64b7ecd66b70783b0dca7b0afc8bfb8a1e'

const MOCK_SIG_1 = '0x27b6fac0bcfbb0ee28787f9aa951078c4f121914904a2b34ddf063bf77ed6e28719c8d19fd14f24f24555869cbae597390827a9264abbf639eb3662ef734fc801c'

const MOCK_SIG_2 = '0x27b6fac0bcfbb0ee28787f9aa951078c4f121914904a2b34ddf063bf77ed6e28719c8d19ed14f24f24555869cbae597390827a9264abbf639eb3662ef734fc801c'

describe('Account', function () {
  beforeEach(async function () {
    const { defaultAccount, proxyOwner_1 } = await getSigners()
    this.defaultAccount = defaultAccount
    this.proxyOwner_1 = proxyOwner_1
    this.transferRecipientAddress = '0xaff9aeda442C8D27a7F01490CA520dbdf088d1a2'

    this.chainId = await defaultAccount.getChainId()

    this.masterAccount = await deployMasterAccount()

    const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls')
    this.testAccountCalls = await TestAccountCalls.deploy()

    const TestEmptyCall = await ethers.getContractFactory('TestEmptyCall')
    this.testEmptyCall = await TestEmptyCall.deploy()
    this.emptyCallAddress = this.testEmptyCall.address
    this.emptyCallData = encodeFunctionCall('testEmpty', [], [])
  })

  describe('sending ETH to proxy account address', function () {
    beforeEach(async function () {
      const { proxyAccount } = await setupProxyAccount()
      this.proxyAccount = proxyAccount

      this.ethSendAmount = BN(3).mul(BN18)
      
      await this.defaultAccount.sendTransaction({
        to: this.proxyAccount.address,
        value: this.ethSendAmount
      })
    })

    it('should succeed and increase proxy account balance', async function () {
      expect(await ethers.provider.getBalance(this.proxyAccount.address)).to.equal(this.ethSendAmount)
    })
  })

  describe('externalCall()', async function() {
    beforeEach(async function () {
      const { proxyAccount, proxyOwner, account } = await setupProxyAccount()
      this.implementationAccount = account
      this.proxyOwner = proxyOwner
      this.proxyAccount = proxyAccount

      const { tokenA } = await deployTestTokens()
      this.tokenA = tokenA
      this.tknAmt = BN18.mul(2)
      await this.tokenA.mint(this.proxyAccount.address, this.tknAmt)
      this.tknTransferCall = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [this.transferRecipientAddress, this.tknAmt.toString()]
      )
    })
    it('call from proxy account owner should call external contract', async function() {
      // testing this with an ERC20.transfer() call
      await this.proxyAccount.connect(this.proxyOwner).externalCall(0, this.tokenA.address, this.tknTransferCall)
      expect(await this.tokenA.balanceOf(this.proxyAccount.address)).to.equal(0)
      expect(await this.tokenA.balanceOf(this.transferRecipientAddress)).to.equal(this.tknAmt)
    })

    it('call from non-owner should revert with \'NotOwner("<msg.sender>")\'', async function() {
      await expect(
        this.proxyAccount.externalCall(0, ZERO_ADDRESS, this.tknTransferCall)
      ).to.be.revertedWith(`NotOwner("${this.defaultAccount.address}")`);
    })

    it('call from proxy account owner with value and 0x data should send ETH', async function() {
      const initalBalance = await ethers.provider.getBalance(this.transferRecipientAddress)
      await this.defaultAccount.sendTransaction({
        to: this.proxyAccount.address,
        value: 1000000
      })
      await this.proxyAccount.connect(this.proxyOwner).externalCall(100, this.transferRecipientAddress, '0x')
      const newBalance = await ethers.provider.getBalance(this.transferRecipientAddress)
      expect(BN(newBalance) > BN(initalBalance))
    })

    it('when call reverts, externalCall should revert', async function () {
      await expect(this.proxyAccount.connect(this.proxyOwner).externalCall(
        0,
        this.tokenA.address,
        encodeFunctionCall(
          'transfer',
          ['address', 'uint'],
          [this.transferRecipientAddress, this.tknAmt.add(1).toString()] // transfer too much
        )
      )).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('when called directly on Account.sol implementation, should revert with \'NotDelegateCall()\'', async function () {
      await expect(
        this.implementationAccount.externalCall(0, this.emptyCallAddress, this.emptyCallData)
      ).to.be.revertedWith('NotDelegateCall()')
    })

    it('gas cost', async function () {
      await snapshotGas(this.proxyAccount.connect(this.proxyOwner).externalCall(0, this.emptyCallAddress, this.emptyCallData))
    })
  })

  describe('delegateCall()', async function() {
    beforeEach(async function () {
      const { proxyAccount, proxyOwner, account } = await setupProxyAccount()
      this.implementationAccount = account
      this.proxyOwner = proxyOwner
      this.proxyAccount = proxyAccount

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
    it('call from proxy account owner should execute delegatecall on external contract', async function() {
      const promise = this.proxyAccount.connect(this.proxyOwner).delegateCall(this.testAccountCalls.address, this.testCall)
      await expect(promise)
                .to.emit(this.proxyAccount, 'MockParamsEvent')
                .withArgs(this.mockUint, this.mockInt, this.mockAddress)
    })

    it('call from non-owner should revert with \'NotOwner("<msg.sender>")\'', async function() {
      const { defaultAccount } = await getSigners()
      await expect(
        this.proxyAccount.connect(defaultAccount).delegateCall(this.testAccountCalls.address, this.testCall)
      ).to.be.revertedWith(`NotOwner("${defaultAccount.address}")`);
    })

    it('when call reverts, delegateCall should revert', async function () {
      await expect(this.proxyAccount.connect(this.proxyOwner).externalCall(
        0,
        this.testAccountCalls.address,
        encodeFunctionCall('testRevert', ['bool'], [true])
      )).to.be.revertedWith('TestAccountCalls: reverted')
    })

    it('when called directly on Account.sol implementation, should revert with \'NotDelegateCall()\'', async function () {
      await expect(
        this.implementationAccount.delegateCall(this.emptyCallAddress, this.emptyCallData)
      ).to.be.revertedWith('NotDelegateCall()')
    })

    it('gas cost', async function () {
      await snapshotGas(this.proxyAccount.connect(this.proxyOwner).delegateCall(this.emptyCallAddress, this.emptyCallData))
    })
  })

  describe('unstructured storage', function () {
    beforeEach(async function () {
      const { proxyAccount, proxyOwner } = await setupProxyAccount()
      this.proxyOwner = proxyOwner
      this.proxyAccount = proxyAccount
    })

    it('should be readable from off-chain', async function () {
      const inputVal = 123456

      // store the input value
      await this.proxyAccount.connect(this.proxyOwner).delegateCall(
        this.testAccountCalls.address,
        encodeFunctionCall('testStore', ['uint'], [inputVal])
      )

      // read the value from off-chian with getStorageAt RPC call
      const outputVal = await ethers.provider.getStorageAt(
        this.proxyAccount.address, soliditySha3('mockUint')
      )
      expect(BN(outputVal)).to.equal(BN(inputVal))
    })
  })

  describe('metaDelegateCall()', function () {
    beforeEach(async function () {
      const { proxyAccount, proxyOwner, account } = await setupProxyAccount()
      this.implementationAccount = account
      this.proxyOwner = proxyOwner
      this.proxyAccount = proxyAccount

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
        contract: this.proxyAccount,
        method: 'metaDelegateCall',
        signer: this.proxyOwner,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData,
        chainId: this.chainId
      })
      await expect(promise).to.emit(this.proxyAccount, 'MockParamsEvent')
        .withArgs(this.mockUint, this.mockInt, this.mockAddress)
    })

    it('when sent with a valid signature and call data to a function that does not expect appended unsigned data', async function () {
      const { promise } = await metaTxPromise({
        contract: this.proxyAccount,
        method: 'metaDelegateCall',
        signer: this.proxyOwner,
        params: [
          this.testAccountCalls.address,
          encodeFunctionCall('testEvent', ['uint'], [this.mockUint.toString()])
        ],
        unsignedData: '0x',
        chainId: this.chainId
      })
      await expect(promise).to.emit(this.proxyAccount, 'MockParamEvent').withArgs(this.mockUint)
    })

    it('when signer is not proxy owner, should revert with NotOwner("<signer>")', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testEvent',
        ['uint256', 'int24', 'address'],
        [ this.mockUint.toString(), this.mockInt, this.mockAddress ]
      ), 1)
      await expect(execMetaTx({
        contract: this.proxyAccount,
        method: 'metaDelegateCall',
        signer: this.defaultAccount,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData,
        chainId: this.chainId
      })).to.be.revertedWith(`NotOwner("${this.defaultAccount.address}")`)
    })

    it('when call reverts, metaDelegateCall should revert', async function () {
      const { signedData, unsignedData } = splitCallData(encodeFunctionCall(
        'testRevert', ['bool'], [true ]
      ), 0)
      await expect(execMetaTx({
        contract: this.proxyAccount,
        method: 'metaDelegateCall',
        signer: this.proxyOwner,
        params: [ this.testAccountCalls.address, signedData ],
        unsignedData,
        chainId: this.chainId
      })).to.be.revertedWith('TestAccountCalls: reverted')
    })

    it('when called directly on Account.sol implementation, should revert with \'NotDelegateCall()\'', async function () {
      await expect(
        this.implementationAccount.metaDelegateCall(
          this.emptyCallAddress, this.emptyCallData, MOCK_SIG_1, '0x'
        )
      ).to.be.revertedWith('NotDelegateCall()')
    })

    it('gas cost', async function () {
      const { proxyAccount } = await setupProxyAccount(this.proxyOwner_1)
      const { promise } = await metaTxPromise({
        contract: proxyAccount,
        method: 'metaDelegateCall',
        signer: this.proxyOwner_1,
        params: [
          this.emptyCallAddress,
          this.emptyCallData
        ],
        unsignedData: '0x',
        chainId: this.chainId
      })
      await snapshotGas(promise)
    })
  })

  describe('metaDelegateCall_EIP1271()', function () {
    beforeEach(async function () {
      const { contractOwnedAccount, proxyOwner, account } = await setupContractOwnedAccount()
      this.implementationAccount = account
      this.contractOwnedAccount = contractOwnedAccount
      this.proxyOwner = proxyOwner

      this.mockUint = BN(12345)
      this.mockUint2 = BN(6789)

      // these are just random hex data
      this.validMockSignature = MOCK_SIG_1
      this.invalidMockSignature = MOCK_SIG_2

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

    it('when proxyOwner validation check for the call fails, should revert with \'InvalidSignature("<hash>", "<signature>")\'', async function () {
        const promise = this.contractOwnedAccount.metaDelegateCall_EIP1271(
          this.testAccountCalls.address, this.invalidCallData, this.invalidMockSignature, '0x'
        )

        // get the hash that metaDelegateCall_EIP1271 computes
        const dataHash = soliditySha3({ t: 'bytes', v: this.invalidCallData })
        const paramsData = encodedParams(
          ['bytes32', 'address', 'bytes32'],
          [META_DELEGATE_CALL_EIP1271_TYPEHASH, this.testAccountCalls.address, dataHash]
        )
        const hash = soliditySha3({ t: 'bytes', v: paramsData })
        await expect(promise).to.be.revertedWith(`InvalidSignature("${hash}", "${this.invalidMockSignature}")`);
      }
    )

    it('when called directly on Account.sol implementation, should revert with \'NotDelegateCall()\'', async function () {
      await expect(
        this.implementationAccount.metaDelegateCall_EIP1271(
          this.testAccountCalls.address, this.validCallData, this.validMockSignature, '0x'
        )
      ).to.be.revertedWith('NotDelegateCall()')
    })

    it('gas cost', async function () {
      const promise = this.contractOwnedAccount.metaDelegateCall_EIP1271(
        this.testAccountCalls.address, this.validCallData, this.validMockSignature, '0x'
      )
      await snapshotGas(promise)
    })
  })
})
