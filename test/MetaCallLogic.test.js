const { ethers } = require('hardhat')
const {
  chaiSolidity,
  ZERO_ADDRESS,
  BN, BN18,
  encodeFunctionCall,
  testMetaTxEndpoint,
  deployTestTokens,
  randomAddress,
  splitCallData,
  metaTxPromise
} = require('@brinkninja/test-helpers')
const { expect } = chaiSolidity()
const { shouldBehaveLikeMetaTransaction } = require('./MetaTransaction.behavior.js')
const { paramTypes, setupMetaAccount, getSigners } = require('./helpers')
const {
  EXECUTE_CALL_PARAM_TYPES,
  EXECUTE_DELEGATE_CALL_PARAM_TYPES,
  EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES
} = paramTypes

function getSignerFn (signerName) {
  return async function () {
    const signer = (await getSigners())[signerName]
    return signer
  }
}

describe('MetaCallLogic', function () {
  beforeEach(async function () {
    const { tokenA, tokenB } = await deployTestTokens()
    this.tokenA = tokenA
    this.tokenB = tokenB

    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount

    const TestDelegated = await ethers.getContractFactory('TestDelegated')
    this.testDelegated = await TestDelegated.deploy()

    const TestFulfillSwap = await ethers.getContractFactory('TestFulfillSwap')
    this.testFulfillSwap = await TestFulfillSwap.deploy()

    this.latestBlock = BN(await ethers.provider.getBlockNumber())
    this.expiryBlock = this.latestBlock.add(BN(1000)) // 1,000 blocks from now
    this.expiredBlock = this.latestBlock.sub(BN(1)) // 1 block ago

    this.metaAccountOwner = (await getSigners()).metaAccountOwner
    this.transferRecipient = (await getSigners()).transferRecipient
  })

  describe('executeCall', function () {
    beforeEach(async function () {
      this.tokenAllocation = BN(6).mul(BN18)
      this.transferAmount = BN(2).mul(BN18)

      this.successCallData = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [this.transferRecipient.address, this.transferAmount.toString()]
      )

      this.failCallData = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [ZERO_ADDRESS, this.transferAmount.toString()]
      )

      this.metaBehavior_paramTypes = EXECUTE_CALL_PARAM_TYPES
      this.metaBehavior_params = [ 0, this.tokenB.address, this.successCallData ]

      await this.tokenB.mint(this.metaAccount.address, this.tokenAllocation)
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'executeCall',
      getSigner: getSignerFn('metaAccountOwner')
    })

    describe('when ether value for call is specified', function () {
      beforeEach(async function () {
        const defaultAccount = (await getSigners()).defaultAccount
        await defaultAccount.sendTransaction({
          to: this.metaAccount.address,
          value: this.transferAmount
        })
        this.transferReceipientStartingBalance = BN(await ethers.provider.getBalance(this.transferRecipient.address))
      })

      testMetaTxEndpoint.call(this, {
        contract: 'metaAccount',
        method: 'executeCall',
        paramTypes: EXECUTE_CALL_PARAM_TYPES,
        conditions: [{
          describe: 'when executing a call with ether value to an address with no contract code',
          getSigner: getSignerFn('metaAccountOwner'),
          paramsFn: function () { return [ this.transferAmount, this.transferRecipient.address, '0x' ] },
          testFn: function () {
            it('should transfer ether value', async function () {
              expect(BN(await ethers.provider.getBalance(this.transferRecipient.address))).to.equal(this.transferReceipientStartingBalance.add(this.transferAmount))
            })
          }
        }]
      })
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'executeCall',
      paramTypes: EXECUTE_CALL_PARAM_TYPES,
      conditions: [
        {
          describe: 'when executing transfer() external call on an ERC20 contract using executeCall()',
          getSigner: getSignerFn('metaAccountOwner'),
          paramsFn: function () { return this.metaBehavior_params },
          testFn: function () {
            it('should execute successfully', async function () {
              expect(await this.tokenB.balanceOf(this.transferRecipient.address)).to.equal(this.transferAmount)
            })
          }
        },
        {
          describe: 'when signer is not proxyOwner',
          getSigner: getSignerFn('badAccount'),
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaCallLogic: executeCall signer is not proxyOwner'
        },
        {
          describe: 'when encoded call fails',
          getSigner: getSignerFn('metaAccountOwner'),
          paramsFn: function () { return [ 0, this.tokenB.address, this.failCallData ] },
          expectRevert: 'ERC20: transfer to the zero address'
        }
      ]
    })
  })

  describe('executeDelegateCall', function () {

    // TODO: add test for delegated function with a return value

    beforeEach(async function () {
      this.noReturnCallData = encodeFunctionCall('testNoReturn', [], [])
      this.returnCallData = encodeFunctionCall('testReturn', [], [])
      this.revertCallData = encodeFunctionCall('testRevert', ['bool'], [true])

      this.metaBehavior_paramTypes = EXECUTE_DELEGATE_CALL_PARAM_TYPES
      this.metaBehavior_params = [ this.testDelegated.address, this.noReturnCallData ]
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'executeDelegateCall',
      getSigner: getSignerFn('metaAccountOwner')
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'executeDelegateCall',
      paramTypes: EXECUTE_DELEGATE_CALL_PARAM_TYPES,
      conditions: [
        {
          describe: 'when executing a valid delegate call',
          getSigner: getSignerFn('metaAccountOwner'),
          paramsFn: function () { return this.metaBehavior_params },
          testFnWithoutSend: function () {      
            it('emits an ExecutedTestCall event', async function () {
              const { promise } = await this.txCall()
              await expect(promise).to.emit(this.metaAccount, 'ExecutedTestCall')
            })
          }
        },
        {
          describe: 'when signer is not proxyOwner',
          getSigner: getSignerFn('badAccount'),
          paramsFn: function () { return this.metaBehavior_params },
          expectRevert: 'MetaCallLogic: executeDelegateCall signer is not proxyOwner'
        },
        {
          describe: 'when encoded call fails',
          getSigner: getSignerFn('metaAccountOwner'),
          paramsFn: function () { return [ this.testDelegated.address, this.revertCallData ] },
          expectRevert: 'TestDelegated: reverted'
        }
      ]
    })
  })

  describe('executePartialSignedDelegateCall', function () {
    describe('delegate call with signed and unsigned params', function () {
      beforeEach(async function () {
        this.mockUint = BN18
        this.mockInt = -12345
        this.mockAddress = (await randomAddress()).address

        const numSignedParams = 2
        this.testCallData = splitCallData(encodeFunctionCall(
          'testEvent',
          ['uint256', 'int24', 'address'],
          [
            this.mockUint.toString(),
            this.mockInt,
            this.mockAddress
          ]
        ), numSignedParams)

        this.metaBehavior_paramTypes = EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES
        this.metaBehavior_params = [
          this.testDelegated.address,
          this.testCallData.signedData
        ]

        this.metaBehavior_unsignedParams = [this.testCallData.unsignedData]
      })

      shouldBehaveLikeMetaTransaction({
        contract: 'metaAccount',
        method: 'executePartialSignedDelegateCall',
        getSigner: getSignerFn('metaAccountOwner')
      })

      it('should execute a partial signed delegated call', async function () {
        const { promise } = await metaTxPromise({
          contract: this.metaAccount,
          method: 'executePartialSignedDelegateCall',
          bitmapIndex: BN(0),
          bit: BN(1),
          signer: this.metaAccountOwner,
          paramTypes: EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES,
          params: [
            this.testDelegated.address,
            this.testCallData.signedData
          ],
          unsignedParams: [this.testCallData.unsignedData]
        })
        await expect(promise)
                .to.emit(this.metaAccount, 'MockParamsEvent')
                .withArgs(this.mockUint, this.mockInt, this.mockAddress)
      })
   })
  })
})
