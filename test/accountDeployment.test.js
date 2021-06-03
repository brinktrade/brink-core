const { ethers } = require('hardhat')
const { deployData, chaiSolidity } = require('@brinkninja/test-helpers')
const { setupDeployers } = require('./helpers')
const { expect } = chaiSolidity()

const chainId = 1

describe('Deploy Account', function () {
  beforeEach(async function () {
    const [a, proxyOwner] = await ethers.getSigners()
    this.proxyOwner = proxyOwner.address
    this.Proxy = await ethers.getContractFactory('Proxy')
    this.AccountLogic = await ethers.getContractFactory('AccountLogic')

    const { singletonFactory, singletonFactoryCaller } = await setupDeployers()
    this.singletonFactory = singletonFactory
    this.singletonFactoryCaller = singletonFactoryCaller
    
    const CallExecutor = await ethers.getContractFactory('CallExecutor')
    const callExecutor = await CallExecutor.deploy()

    this.metaAccountImpl = await this.AccountLogic.deploy(callExecutor.address)
    const salt = ethers.utils.formatBytes32String('some.salt')

    const { address, initCode } = deployData(
      this.singletonFactory.address,
      this.Proxy.bytecode,
      this.metaAccountImpl.address,
      this.proxyOwner,
      chainId,
      salt
    )
    this.accountAddress = address
    this.accountCode = initCode

    await singletonFactoryCaller.deploy(this.accountCode, salt)

    this.account = await this.AccountLogic.attach(this.accountAddress)
  })

  it('should deploy proxy contract at the predeployed computed address', async function () {
    expect(await ethers.provider.getCode(this.accountAddress)).to.not.equal('0x')
  })

  it('should set implementation', async function () {
    const implementation = await this.account.implementation()
    expect(implementation).to.be.equal(this.metaAccountImpl.address)
  })

  it('should set proxyOwner', async function () {
    const isOwner = await this.account.isProxyOwner(this.proxyOwner)
    expect(isOwner).to.be.equal(true)
  })
})