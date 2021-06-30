const { ethers } = require('hardhat')
const {
  BN, BN18,
  deployData,
  chaiSolidity,
  deployTestTokens
} = require('@brinkninja/test-helpers')
const { setupDeployers } = require('./helpers')
const { expect } = chaiSolidity()

const chainId = 1

describe('Proxy', function () {
  beforeEach(async function () {
    const [defaultAccount, proxyOwner] = await ethers.getSigners()
    this.defaultAccount = defaultAccount
    this.proxyOwner = proxyOwner
    this.Proxy = await ethers.getContractFactory('Proxy')
    this.Account = await ethers.getContractFactory('Account')

    const CallExecutor = await ethers.getContractFactory('CallExecutor')
    const callExecutor = await CallExecutor.deploy()

    this.metaAccountImpl = await this.Account.deploy(callExecutor.address)

    const { singletonFactory, singletonFactoryCaller } = await setupDeployers()
    this.singletonFactory = singletonFactory
    this.singletonFactoryCaller = singletonFactoryCaller
    
    const salt = ethers.utils.formatBytes32String('some.salt')

    const { address, initCode } = deployData(
      this.singletonFactory.address,
      this.Proxy.bytecode,
      this.metaAccountImpl.address,
      this.proxyOwner.address,
      chainId,
      salt
    )
    this.accountAddress = address
    this.accountCode = initCode

    await singletonFactoryCaller.deploy(this.accountCode, salt)

    this.account = await this.Account.attach(this.accountAddress)
  })

  describe('when proxy is deployed', function () {
    it('new proxy contract code should be stored predeployed computed address', async function () {
      expect(await ethers.provider.getCode(this.accountAddress)).to.not.equal('0x')
    })

    it('should set implementation', async function () {
      const implementation = await this.account.implementation()
      expect(implementation).to.be.equal(this.metaAccountImpl.address)
    })

    it('should set proxyOwner', async function () {
      expect(await this.account.proxyOwner()).to.be.equal(this.proxyOwner.address)
    })
  })

  describe('when Proxy account receives ETH', function () {
    it('should send Eth to the account', async function () {
      this.ethTransferAmount = BN(2).mul(BN18)
      await this.defaultAccount.sendTransaction({
        to: this.account.address,
        value: this.ethTransferAmount
      })
      expect(await ethers.provider.getBalance(this.account.address)).to.equal(this.ethTransferAmount)
    })
  })

  describe('when Proxy account receives ERC20', function () {
    it('should send ERC20 to the account', async function () {
      const { tokenA } = await deployTestTokens()
      this.tokenA = tokenA
      this.tokenTransferAmount = BN(2).mul(BN18)
      await this.tokenA.mint(this.defaultAccount.address, this.tokenTransferAmount)
      await this.tokenA.transfer(this.account.address, this.tokenTransferAmount)
      expect(await this.tokenA.balanceOf(this.account.address)).to.equal(this.tokenTransferAmount)
    })
  })
})