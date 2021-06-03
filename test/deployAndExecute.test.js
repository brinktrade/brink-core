const { ethers } = require('hardhat')
const {
  chaiSolidity,
  encodeFunctionCall,
  signMetaTx,
  splitCallData,
  deployData,
  deployTestTokens,
  BN, BN18
} = require('@brinkninja/test-helpers')
const { paramTypes, setupDeployers } = require('./helpers')
const { EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES } = paramTypes
const { expect } = chaiSolidity()

const chainId = 1

describe('DeployAndExecute', function () {
  beforeEach(async function () {
    const [ ethStoreAccount, proxyOwner ] = await ethers.getSigners()
    this.ethStoreAccount = ethStoreAccount
    this.proxyOwner = proxyOwner

    this.Proxy = await ethers.getContractFactory('Proxy')
    this.AccountLogic = await ethers.getContractFactory('AccountLogic')
    this.CallExecutor = await ethers.getContractFactory('CallExecutor')

    const { singletonFactory, deployAndExecute } = await setupDeployers()
    this.singletonFactory = singletonFactory
    this.deployAndExecute = deployAndExecute

    const { tokenA, tokenB } = await deployTestTokens()
    this.tokenA = tokenA
    this.tokenB = tokenB

    this.latestBlock = BN(await ethers.provider.getBlockNumber())
    this.expiryBlock = this.latestBlock.add(BN(1000)) // 1,000 blocks from now
    this.expiredBlock = this.latestBlock.sub(BN(1)) // 1 block ago

    const callExecutor = await this.CallExecutor.deploy()
    this.metaAccountImpl = await this.AccountLogic.deploy(callExecutor.address)
    this.salt = ethers.utils.formatBytes32String('some.salt')

    const { address, initCode } = deployData(
      this.singletonFactory.address,
      this.Proxy.bytecode,
      this.metaAccountImpl.address,
      this.proxyOwner.address,
      chainId,
      this.salt
    )
    this.accountAddress = address
    this.accountCode = initCode
  })

  it('TMP PLACEHOLDER', function () {

  })

  // TODO: remove limitSwapDelegated as a dependency to this test and replace with a mock

  // describe('deterministic deploy batched with a delegated token to ETH swap', function () {
  //   beforeEach(async function () {
  //     this.tokenASwapAmount = BN(2).mul(BN18)
  //     this.ethSwapAmount = BN(4).mul(BN18)
  //     await this.ethStoreAccount.sendTransaction({
  //       to: this.testFulfillSwap.address,
  //       value: this.ethSwapAmount
  //     })

  //     const numSignedParams = 4

  //     this.successCall = splitCallData(encodeFunctionCall(
  //       'tokenToEth',
  //       LIMIT_SWAP_TOKEN_TO_ETH_PARAM_TYPES.map(t => t.type),
  //       [
  //         this.tokenA.address,
  //         this.tokenASwapAmount.toString(),
  //         this.ethSwapAmount.toString(),
  //         this.expiryBlock.toString(),
  //         this.testFulfillSwap.address,
  //         encodeFunctionCall(
  //           'fulfillEthOutSwap',
  //           ['uint', 'address'],
  //           [ this.ethSwapAmount.toString(), this.accountAddress ]
  //         )
  //       ]
  //     ).slice(2), numSignedParams)

  //     this.successCallData = encodeFunctionCall(
  //       'fulfillEthOutSwap',
  //       ['uint', 'address'],
  //       [ this.ethSwapAmount.toString(), this.accountAddress ]
  //     )

  //     const paramTypes = EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_PARAM_TYPES
  //     const params = [
  //       this.limitSwapDelegated.address,
  //       this.successCall.signedData
  //     ]

  //     const { signature } = await signMetaTx({
  //       contract: { address: this.accountAddress },
  //       method: 'executePartialSignedDelegateCall',
  //       bitmapIndex: BN(0),
  //       bit: BN(1),
  //       signer: this.proxyOwner,
  //       paramTypes,
  //       params
  //     })

  //     // data for the tokenToEth swap call
  //     const execData = (await this.metaAccountImpl.populateTransaction.executePartialSignedDelegateCall.apply(this, [
  //       BN(0), BN(1), ...params, signature, this.successCall.unsignedData
  //     ])).data

  //     // mint tokenA to undeployed account address
  //     await this.tokenA.mint(this.accountAddress, this.tokenASwapAmount)

  //     // batched deploy account + executePartialSignedDelegateCall to LimitSwapDelegated.tokenToEth()
  //     await this.deployAndExecute.deployAndExecute(this.accountCode, this.salt, execData)
  //   })

//     it('should deploy the account and swap the account token balance for ETH', async function () {
//       expect(await ethers.provider.getCode(this.accountAddress)).to.not.equal('0x')
//       expect(await this.tokenA.balanceOf(this.accountAddress)).to.equal(BN(0))
//       expect(await ethers.provider.getBalance(this.accountAddress)).to.equal(this.ethSwapAmount)
//     })
//   })
})
