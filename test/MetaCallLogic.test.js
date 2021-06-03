const { ethers } = require('hardhat')
const {
  chaiSolidity,
  ZERO_ADDRESS,
  BN, BN18,
  encodeFunctionCall,
  testMetaTxEndpoint,
  deployTestTokens
} = require('@brinkninja/test-helpers')
const { expect } = chaiSolidity()
const { shouldBehaveLikeMetaTransaction } = require('./MetaTransaction.behavior.js')
const { paramTypes, setupMetaAccount, getSigners } = require('./helpers')
const {
  EXECUTE_CALL_PARAM_TYPES,
  EXECUTE_DELEGATE_CALL_PARAM_TYPES,
  EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES,
  LIMIT_SWAP_TOKEN_TO_TOKEN_PARAM_TYPES
} = paramTypes

function getSignerFn (signerName) {
  return async function () {
    const signer = (await getSigners())[signerName]
    return signer
  }
}

describe('MetaCallLogic', function () {
  beforeEach(async function () {
    const TestDelegated = await ethers.getContractFactory('TestDelegated')
    const TestMetaDelegated = await ethers.getContractFactory('TestMetaDelegated')
    const TestFulfillSwap = await ethers.getContractFactory('TestFulfillSwap')

    this.transferRecipient = (await getSigners()).transferRecipient

    const { tokenA, tokenB } = await deployTestTokens()
    const { metaAccount } = await setupMetaAccount()
    this.testFulfillSwap = await TestFulfillSwap.deploy()

    // use TestMetaDelegated here so all events/functions for Delegated contract
    // calls are available
    this.metaAccount = await TestMetaDelegated.attach(metaAccount.address)

    this.testDelegated = await TestDelegated.deploy()
    this.tokenA = tokenA
    this.tokenB = tokenB

    this.latestBlock = BN(await ethers.provider.getBlockNumber())
    this.expiryBlock = this.latestBlock.add(BN(1000)) // 1,000 blocks from now
    this.expiredBlock = this.latestBlock.sub(BN(1)) // 1 block ago
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

  // TODO: replace limitSwapDelegated with a mock delegated

  // describe('executePartialSignedDelegateCall', function () {
  //   describe('LimitSwapDelegated.tokenToToken', function () {
  //     beforeEach(async function () {
  //       this.tokenIn = this.tokenA.address
  //       this.tokenOut = this.tokenB.address
  //       this.tokenInAmount = BN(333).mul(BN18)
  //       this.tokenOutAmount = BN(444).mul(BN18)

  //       await this.tokenA.mint(this.metaAccount.address, this.tokenInAmount)
  //       await this.tokenB.mint(this.testFulfillSwap.address, this.tokenOutAmount)

  //       this.fulfillSwapCallData = encodeFunctionCall(
  //         'fulfillTokenOutSwap',
  //         ['address', 'uint', 'address'],
  //         [
  //           this.tokenOut,
  //           this.tokenOutAmount.toString(),
  //           this.metaAccount.address
  //         ]
  //       )

  //       const swapTokenToTokenParamTypes = LIMIT_SWAP_TOKEN_TO_TOKEN_PARAM_TYPES.map(t => t.type)

  //       const delegateCallData = encodeFunctionCall(
  //         'tokenToToken',
  //         swapTokenToTokenParamTypes,
  //         [
  //           this.tokenIn,
  //           this.tokenOut,
  //           this.tokenInAmount.toString(),
  //           this.tokenOutAmount.toString(),
  //           this.expiryBlock.toString(),
  //           this.testFulfillSwap.address,
  //           this.fulfillSwapCallData
  //         ]
  //       ).slice(2)

  //       // signed data is the prefix + fnSig + signedParams
  //       const numSignedParams = 5
  //       const bytes32SlotLen = 64
  //       const fnSigLen = 8
  //       const signedDataLen = fnSigLen + (numSignedParams * bytes32SlotLen)
  //       const signedData = `0x${delegateCallData.slice(0, signedDataLen)}`

  //       // unsigned data is the rest
  //       const unsignedData = `0x${delegateCallData.slice(signedDataLen)}`

  //       this.metaBehavior_paramTypes = EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES
  //       this.metaBehavior_params = [
  //         this.limitSwapDelegated.address,
  //         signedData
  //       ]

  //       this.metaBehavior_unsignedParams = [unsignedData]
  //     })

  //     shouldBehaveLikeMetaTransaction({
  //       contract: 'metaAccount',
  //       method: 'executePartialSignedDelegateCall',
  //       getSigner: getSignerFn('metaAccountOwner')
  //     })

  //     testMetaTxEndpoint.call(this, {
  //       contract: 'metaAccount',
  //       method: 'executePartialSignedDelegateCall',
  //       paramTypes: EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES,
  //       conditions: [
  //         {
  //           describe: 'when executing a valid call',
  //           getSigner: getSignerFn('metaAccountOwner'),
  //           paramsFn: function () { return this.metaBehavior_params },
  //           unsignedParamsFn: function () { return this.metaBehavior_unsignedParams },
  //           testFn: function () {
  //             it('should execute successfully', async function () {
  //               expect(await this.tokenA.balanceOf(this.metaAccount.address)).to.equal(BN(0))
  //               expect(await this.tokenB.balanceOf(this.metaAccount.address)).to.equal(this.tokenOutAmount)
  //               expect(await this.tokenA.balanceOf(this.testFulfillSwap.address)).to.equal(this.tokenInAmount)
  //               expect(await this.tokenB.balanceOf(this.testFulfillSwap.address)).to.equal(BN(0))
  //             })
  //           }
  //         }
  //       ]
  //     })
  //  })
  // })
})
