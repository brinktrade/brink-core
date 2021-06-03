const { ethers } = require('hardhat')
const {
  deployTestTokens, BN, BN18, chaiSolidity
} = require('@brinkninja/test-helpers')
const { setupMetaAccount } = require('./helpers')
const { expect } = chaiSolidity()

describe('incoming transfers', function () {
  beforeEach(async function () {
    this.tokenSender = (await ethers.getSigners())[0]
    const { tokenA } = await deployTestTokens()
    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount
    this.tokenA = tokenA
  })

  describe('when Proxy account receives Eth', function () {
    beforeEach(async function () {
      this.ethTransferAmount = BN(2).mul(BN18)
      await this.tokenSender.sendTransaction({
        to: this.metaAccount.address,
        value: this.ethTransferAmount
      })
    })

    it('should send Eth to the account', async function () {
      expect(await ethers.provider.getBalance(this.metaAccount.address)).to.equal(this.ethTransferAmount)
    })
  })

  describe('when Proxy account receives ERC20', function () {
    beforeEach(async function () {
      this.tokenTransferAmount = BN(2).mul(BN18)
      await this.tokenA.mint(this.tokenSender.address, this.tokenTransferAmount)
      await this.tokenA.transfer(this.metaAccount.address, this.tokenTransferAmount)
    })

    it('should send ERC20 to the account', async function () {
      expect(await this.tokenA.balanceOf(this.metaAccount.address)).to.equal(this.tokenTransferAmount)
    })
  })
})
