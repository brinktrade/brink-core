const { ethers } = require('hardhat')
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, encodeFunctionCall, deployData } = brinkUtils
const { BN18 } = brinkUtils.constants
const { signMetaTx, deployTestTokens } = brinkUtils.testHelpers(ethers)
const { setupDeployers, getSigners, snapshotGas } = require('./helpers')

const chainId = 1

describe('DeployAndCall', function () {
  beforeEach(async function () {
    const signers = await getSigners()
    this.ethStoreAccount = signers.defaultAccount
    this.proxyOwner = signers.metaAccountOwner
    this.recipient = signers.transferRecipient

    this.Proxy = await ethers.getContractFactory('Proxy')
    this.Account = await ethers.getContractFactory('Account')
    this.testAccountCalls = await ethers.getContractFactory('TestAccountCalls')

    const TestEmptyCall = await ethers.getContractFactory('TestEmptyCall')
    this.testEmptyCall = await TestEmptyCall.deploy()
    this.emptyCallAddress = this.testEmptyCall.address
    this.emptyCallData = encodeFunctionCall('testEmpty', [], [])

    this.metaAccountImpl = await this.Account.deploy(chainId)
    this.salt = '0x841eb53dae7d7c32f92a7e2a07956fb3b9b1532166bc47aa8f091f49bcaa9ff5'
    
    const { singletonFactory, deployAndCall, accountFactory } = await setupDeployers(this.metaAccountImpl)
    this.singletonFactory = singletonFactory
    this.deployAndCall = deployAndCall
    this.accountFactory = accountFactory
    const { tokenA, tokenB } = await deployTestTokens()
    this.tokenA = tokenA
    this.tokenB = tokenB

    this.latestBlock = BN(await ethers.provider.getBlockNumber())
    this.expiryBlock = this.latestBlock.add(BN(1000)) // 1,000 blocks from now
    this.expiredBlock = this.latestBlock.sub(BN(1)) // 1 block ago

    this.testAccountCalls = await this.testAccountCalls.deploy()

    const { address } = deployData(
      this.accountFactory.address,
      this.Proxy.bytecode,
      this.metaAccountImpl.address,
      this.proxyOwner.address,
      this.salt
    )
    this.accountAddress = address

    this.iRecipientBalance = await ethers.provider.getBalance(this.recipient.address)
  })

  describe('deployAndCall()', function () {
    describe('with callData that does not revert', function () {
      beforeEach(async function () {
        this.ethAmount = BN(4).mul(BN18)
  
        this.testTransferETHCallData = encodeFunctionCall(
          'testTransferETH',
          ['uint', 'address'],
          [this.ethAmount, this.recipient.address]
        )
  
        const params = [
          this.testAccountCalls.address,
          this.testTransferETHCallData
        ]
  
        const { signature } = await signMetaTx({
          contract: { address: this.accountAddress },
          method: 'metaDelegateCall',
          signer: this.proxyOwner,
          params
        })
  
        // data for the tokenToEth swap call
        this.callData = (await this.metaAccountImpl.connect(this.proxyOwner).populateTransaction.metaDelegateCall.apply(this, [
          ...params, signature, '0x'
        ])).data
  
        // send ETH to undeployed account address
        await this.ethStoreAccount.sendTransaction({
          to: this.accountAddress,
          value: this.ethAmount
        })

        this.deployAndCallPromise = this.deployAndCall.deployAndCall(this.proxyOwner.address, this.callData)
      })

      it('should deploy the account', async function () {
        await this.deployAndCallPromise
        expect(await ethers.provider.getCode(this.accountAddress)).to.not.equal('0x')
      })

      it('should delegatecall testTransferETH() to transfer ETH', async function () {
        await this.deployAndCallPromise
  
        // get final recipient balance
        const fRecipientBalance = await ethers.provider.getBalance(this.recipient.address)
  
        expect(await this.tokenA.balanceOf(this.accountAddress)).to.equal(0)
        expect(await ethers.provider.getBalance(this.accountAddress)).to.equal(0)
        expect(fRecipientBalance.sub(this.iRecipientBalance)).to.equal(this.ethAmount)
      })

      it('gas cost', async function () {
        await snapshotGas(this.deployAndCallPromise)
      })
    })

    describe('with callData that reverts', function () {
      it('should revert with error message from the account calldata execution', async function () {
        this.testRevertCallData = encodeFunctionCall('testRevert', ['bool'], [true])
        const params = [ this.testAccountCalls.address, this.testRevertCallData ]
  
        const { signature } = await signMetaTx({
          contract: { address: this.accountAddress },
          method: 'metaDelegateCall',
          signer: this.proxyOwner,
          params
        })
  
        // data for the testRevert call
        this.callData = (await this.metaAccountImpl.connect(this.proxyOwner).populateTransaction.metaDelegateCall.apply(this, [
          ...params, signature, '0x'
        ])).data

        expect(this.deployAndCall.deployAndCall(this.proxyOwner.address, this.callData))
          .to.be.revertedWith('TestAccountCalls: reverted')
      })
    })
  })
})
