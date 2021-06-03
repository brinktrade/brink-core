const { expect } = require('chai')
const { ethers } = require('hardhat')
const { setupMetaAccount } = require('./helpers/setup')
const { BN, BN18 } = require('./helpers/bignumber')

describe('AccountLogic', function () {
  beforeEach(async function () {
    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount
  })

  describe('pay ETH to contract', function () {
    beforeEach(async function () {
      this.ethStoreAccount = (await ethers.getSigners())[0]
      this.ethSendAmount = BN(3).mul(BN18)
      
      await this.ethStoreAccount.sendTransaction({
        to: this.metaAccount.address,
        value: this.ethSendAmount
      })
    })

    it('should send ETH to MetaAccount contract', async function () {
      expect(await ethers.provider.getBalance(this.metaAccount.address), 'wrong ETH balance for MetaAccount contract').to.equal(this.ethSendAmount)
    })
  })
})
