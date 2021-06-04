const { ethers } = require('hardhat')
const {
  chaiSolidity,
  encodeFunctionCall,
  execMetaTx,
  signMetaTx,
  metaTxPromiseWithSignedData,
  deployTestTokens,
  bnToBinaryString,
  BN, BN18
} = require('@brinkninja/test-helpers')
const { expect } = chaiSolidity()
const { getSigners, setupMetaAccount } = require('./helpers')

describe('MetaTxBase', function () {
  beforeEach(async function () {
    const { tokenA, tokenB } = await deployTestTokens()
    this.tokenA = tokenA
    this.tokenB = tokenB

    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount

    const TestDelegated = await ethers.getContractFactory('TestDelegated')
    this.testDelegated = await TestDelegated.deploy()
  })

  describe('Replay protection', function () {
    beforeEach(async function () {
      const transferRecipientAddress = (await getSigners()).transferRecipient.address
      this.tokenAllocation = BN(6).mul(BN18)
      this.transferAmount = BN(2).mul(BN18)

      this.successCallData = encodeFunctionCall(
        'transfer',
        ['address', 'uint'],
        [transferRecipientAddress, this.transferAmount.toString()]
      )

      this.paramTypes = [
        { name: 'value', type: 'uint256' },
        { name: 'to', type: 'address' },
        { name: 'data', type: 'bytes' }
      ]
      this.params = [ BN(0), this.tokenB.address, this.successCallData ]
    })

    it('should succeed when transactions within the same bitmap are not executed in sequence', async function () {
      await execMetaTokenTransfer.call(this, BN(0), BN(4)) // slot 0, index 2 : 2**2 = 4
      await execMetaTokenTransfer.call(this, BN(0), BN(1)) // slot 0, index 0 : 2**0 = 1
      const bitmap = await this.metaAccount.getReplayProtectionBitmap(0)
      expect(bnToBinaryString(bitmap)).to.equal('101')
    })

    it('should succeed when transactions in different bitmaps are not executed in sequence', async function () {
      await execMetaTokenTransfer.call(this, BN(1), BN(1)) // slot 1, index 0 : 2**0 = 1
      await execMetaTokenTransfer.call(this, BN(0), BN(1)) // slot 0, index 0 : 2**0 = 1
      const bitmap0 = await this.metaAccount.getReplayProtectionBitmap(0)
      expect(bnToBinaryString(bitmap0)).to.equal('1')
      const bitmap1 = await this.metaAccount.getReplayProtectionBitmap(1)
      expect(bnToBinaryString(bitmap1)).to.equal('1')
    })

    it('should revert when trying to execute with a used bit in non-zero index bitmap', async function () {
      await execMetaTokenTransfer.call(this, BN(1), BN(8)) // slot 1, index 3 : 2**3 = 8

      await this.tokenB.mint(this.metaAccount.address, this.tokenAllocation)
      const signedData = await signMetaTx({
        contract: this.metaAccount,
        method: 'executeCall',
        bitmapIndex: BN(1),
        bit: BN(8),
        signer: (await getSigners()).metaAccountOwner,
        paramTypes: this.paramTypes,
        params: this.params
      })
      const { promise } = metaTxPromiseWithSignedData({
        contract: this.metaAccount,
        signedData
      })
      await expect(promise).to.be.revertedWith('MetaTxBase: bit is used')
    })
  })

  async function execMetaTokenTransfer(bitmapIndex, bit) {
    await this.tokenB.mint(this.metaAccount.address, this.tokenAllocation)
    await execMetaTx({
      contract: this.metaAccount,
      method: 'executeCall',
      bitmapIndex,
      bit,
      signer: (await getSigners()).metaAccountOwner,
      paramTypes: this.paramTypes,
      params: this.params
    })
  }
})
