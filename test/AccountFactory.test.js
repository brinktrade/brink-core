const { ethers } = require('hardhat')
const { expect } = require('chai')
const brinkUtils = require('@brinkninja/utils')
const { toChecksumAddress } = require('web3-utils')
const { deployData } = brinkUtils
const { setupDeployers, getSigners, snapshotGas } = require('./helpers')

const chainId = 1

describe('AccountFactory', function () {
  beforeEach(async function () {
    const signers = await getSigners()
    this.proxyOwner = signers.metaAccountOwner

    this.Proxy = await ethers.getContractFactory('Proxy')
    this.Account = await ethers.getContractFactory('Account')

    this.metaAccountImpl = await this.Account.deploy(chainId)
    this.salt = '0x841eb53dae7d7c32f92a7e2a07956fb3b9b1532166bc47aa8f091f49bcaa9ff5'
    
    const { accountFactory } = await setupDeployers(this.metaAccountImpl)
    this.accountFactory = accountFactory

    const { address } = deployData(
      this.accountFactory.address,
      this.Proxy.bytecode,
      this.metaAccountImpl.address,
      this.proxyOwner.address,
      this.salt
    )
    this.accountAddress = address
  })

  describe('deployAccount()', function () {
    it('should deploy the account', async function () {
      await this.accountFactory.deployAccount(this.proxyOwner.address)
      expect(await ethers.provider.getCode(this.accountAddress)).to.not.equal('0x')
    })

    it('should emit an AccountDeployed() event with account address param', async function () {
      const promise = this.accountFactory.deployAccount(this.proxyOwner.address)
      await expect(promise)
              .to.emit(this.accountFactory, 'AccountDeployed')
              .withArgs(toChecksumAddress(this.accountAddress))
    })

    it('gas cost', async function () {
      await snapshotGas(this.accountFactory.deployAccount(this.proxyOwner.address))
    })
  })
})
