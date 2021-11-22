const { ethers } = require('hardhat')
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, encodeFunctionCall } = brinkUtils
const { BN18 } = brinkUtils.constants
const { signMetaTx, deployTestTokens } = brinkUtils.testHelpers(ethers)
const {
  deployMasterAccount,
  deployDeployAndCall,
  deployAccountFactory,
  proxyAccountFromOwner,
  randomProxyAccount,
  getSigners,
  snapshotGas
} = require('./helpers')

describe('DeployAndCall', function () {
  beforeEach(async function () {
    const { defaultAccount, transferRecipient, proxyOwner_3 } = await getSigners()
    this.ethStoreAccount = defaultAccount
    this.proxyOwner_3 = proxyOwner_3
    this.recipient = transferRecipient

    this.chainId = await defaultAccount.getChainId()

    const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls')
    const TestEmptyCall = await ethers.getContractFactory('TestEmptyCall')
    this.testEmptyCall = await TestEmptyCall.deploy()
    this.emptyCallAddress = this.testEmptyCall.address
    this.emptyCallData = encodeFunctionCall('testEmpty', [], [])

    this.masterAccount = await deployMasterAccount()
    this.deployAndCall = await deployDeployAndCall()
    this.accountFactory = await deployAccountFactory()

    const { tokenA, tokenB } = await deployTestTokens()
    this.tokenA = tokenA
    this.tokenB = tokenB

    this.latestBlock = BN(await ethers.provider.getBlockNumber())
    this.expiryBlock = this.latestBlock.add(BN(1000)) // 1,000 blocks from now
    this.expiredBlock = this.latestBlock.sub(BN(1)) // 1 block ago

    this.testAccountCalls = await TestAccountCalls.deploy()

    const { proxyOwner, proxyAccount } = await randomProxyAccount()
    this.proxyOwner = proxyOwner
    this.proxyAccount = proxyAccount

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

        this.getDeployAndCallPromiseForProxyOwner = async function (proxyOwner) {
          const proxyAccountAddress = await proxyAccountFromOwner(proxyOwner.address)
          const { signature } = await signMetaTx({
            contract: { address: proxyAccountAddress },
            method: 'metaDelegateCall',
            signer: proxyOwner,
            params,
            chainId: this.chainId
          })
    
          // data for the tokenToEth swap call
          const callData = (await this.masterAccount.connect(proxyOwner).populateTransaction.metaDelegateCall.apply(this, [
            ...params, signature, '0x'
          ])).data
    
          // send ETH to undeployed account address
          await this.ethStoreAccount.sendTransaction({
            to: proxyAccountAddress,
            value: this.ethAmount
          })
  
          return this.deployAndCall.deployAndCall(proxyOwner.address, callData)
        }
      })

      it('should deploy the account', async function () {
        const promise = await this.getDeployAndCallPromiseForProxyOwner(this.proxyOwner)
        await promise
        expect(await ethers.provider.getCode(this.proxyAccount.address)).to.not.equal('0x')
      })

      it('should delegatecall testTransferETH() to transfer ETH', async function () {
        const promise = await this.getDeployAndCallPromiseForProxyOwner(this.proxyOwner)
        await promise
  
        // get final recipient balance
        const fRecipientBalance = await ethers.provider.getBalance(this.recipient.address)
  
        expect(await this.tokenA.balanceOf(this.proxyAccount.address)).to.equal(0)
        expect(await ethers.provider.getBalance(this.proxyAccount.address)).to.equal(0)
        expect(fRecipientBalance.sub(this.iRecipientBalance)).to.equal(this.ethAmount)
      })

      it('gas cost', async function () {
        // use deterministic proxyOwner for gas cost snapshot so amount stays fixed
        const promise = await this.getDeployAndCallPromiseForProxyOwner(this.proxyOwner_3)
        await snapshotGas(promise)
      })
    })

    describe('with callData that reverts', function () {
      it('should revert with error message from the account calldata execution', async function () {
        const testRevertCallData = encodeFunctionCall('testRevert', ['bool'], [true])
        const params = [ this.testAccountCalls.address, testRevertCallData ]
  
        const { signature } = await signMetaTx({
          contract: { address: this.proxyAccount.address },
          method: 'metaDelegateCall',
          signer: this.proxyOwner,
          params,
          chainId: this.chainId
        })
  
        // data for the testRevert call
        const callData = (await this.masterAccount.connect(this.proxyOwner).populateTransaction.metaDelegateCall.apply(this, [
          ...params, signature, '0x'
        ])).data

        expect(this.deployAndCall.deployAndCall(this.proxyOwner.address, callData))
          .to.be.revertedWith('TestAccountCalls: reverted')
      })
    })
  })
})
