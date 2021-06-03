const { ethers } = require('hardhat')
const { BN, BN18, chaiSolidity } = require('@brinkninja/test-helpers')
const { setupMetaAccount, getSigners } = require('./helpers')
const { expect } = chaiSolidity()

describe('AccountLogic', function () {
  beforeEach(async function () {
    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount
  })

  describe('pay ETH to contract', function () {
    beforeEach(async function () {
      this.ethStoreAccount = (await getSigners()).defaultAccount
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
