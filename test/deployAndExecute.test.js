const { ethers } = require('hardhat')
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { BN, encodeFunctionCall, deployData } = brinkUtils
const { BN18 } = brinkUtils.constants
const { signMetaTx, deployTestTokens } = brinkUtils.testHelpers(ethers)
const { setupDeployers, getSigners, snapshotGas } = require('./helpers')

const chainId = 1

describe('DeployAndExecute', function () {
  beforeEach(async function () {
    const signers = await getSigners()
    this.ethStoreAccount = signers.defaultAccount
    this.proxyOwner = signers.metaAccountOwner
    this.recipient = signers.transferRecipient

    this.Proxy = await ethers.getContractFactory('Proxy')
    this.Account = await ethers.getContractFactory('Account')
    this.testAccountCalls = await ethers.getContractFactory('TestAccountCalls')

    this.metaAccountImpl = await this.Account.deploy(chainId)
    this.salt = ethers.utils.formatBytes32String('some.salt')
    
    const { singletonFactory, deployAndExecute } = await setupDeployers()
    this.singletonFactory = singletonFactory
    this.deployAndExecute = deployAndExecute
    const { tokenA, tokenB } = await deployTestTokens()
    this.tokenA = tokenA
    this.tokenB = tokenB

    this.latestBlock = BN(await ethers.provider.getBlockNumber())
    this.expiryBlock = this.latestBlock.add(BN(1000)) // 1,000 blocks from now
    this.expiredBlock = this.latestBlock.sub(BN(1)) // 1 block ago

    this.testAccountCalls = await this.testAccountCalls.deploy()

    const { address, initCode } = deployData(
      this.singletonFactory.address,
      this.Proxy.bytecode,
      this.metaAccountImpl.address,
      this.proxyOwner.address,
      this.salt
    )
    this.accountAddress = address
    this.accountCode = initCode

    this.iRecipientBalance = await ethers.provider.getBalance(this.recipient.address)
  })

  describe('deploy account and delegate call in one tx', function () {
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
      this.execData = (await this.metaAccountImpl.connect(this.proxyOwner).populateTransaction.metaDelegateCall.apply(this, [
        ...params, signature
      ])).data

      // send ETH to undeployed account address
      await this.ethStoreAccount.sendTransaction({
        to: this.accountAddress,
        value: this.ethAmount
      })
    })

    it('should deploy the account and delegatecall testTransferETH() to transfer ETH', async function () {
      // batched deploy account + metaDelegateCall
      await this.deployAndExecute.connect(this.proxyOwner).deployAndExecute(this.accountCode, this.salt, this.execData)

      // get final recipient balance
      const fRecipientBalance = await ethers.provider.getBalance(this.recipient.address)

      expect(await ethers.provider.getCode(this.accountAddress)).to.not.equal('0x')
      expect(await this.tokenA.balanceOf(this.accountAddress)).to.equal(0)
      expect(await ethers.provider.getBalance(this.accountAddress)).to.equal(0)
      expect(fRecipientBalance.sub(this.iRecipientBalance)).to.equal(this.ethAmount)
    })

    it('gas cost', async function () {
      await snapshotGas(this.deployAndExecute.connect(this.proxyOwner).deployAndExecute(this.accountCode, this.salt, this.execData))
    })
  })
})
