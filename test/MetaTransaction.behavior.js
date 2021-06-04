const { ethers } = require('hardhat')
const {
  chaiSolidity,
  execMetaTx,
  nextAvailableBit
} = require('@brinkninja/test-helpers')
const { expect } = chaiSolidity()

const shouldFn = ({
  contract,
  method,
  getSigner,
  only
}) => {
  const describeFn = only ? describe.only : describe

  describeFn('meta transaction behavior', function () {

    describe('when meta tx succeeds', async function () {
      beforeEach(async function () {
        const { bitmapIndex, bit } = await nextAvailableBit(this[contract])
        this.bitmapIndex = bitmapIndex
        this.bit = bit

        const { tx, signedData } = await execMetaTx({
          contract: this[contract],
          method,
          bitmapIndex,
          bit,
          signer: await getSigner(),
          unsignedParams: this.metaBehavior_unsignedParams,
          paramTypes: this.metaBehavior_paramTypes,
          params: this.metaBehavior_params,
          value: this.metaBehavior_value
        })
        this.tx = tx
        this.receipt = await ethers.provider.getTransactionReceipt(tx.hash)
        this.signedData = signedData
      })
    
      it('should store the used bit', async function () {
        const bitUsed = await this[contract].replayProtectionBitUsed(this.bitmapIndex, this.bit)
        expect(bitUsed).to.equal(true)
      })
    })

    it('should revert when signed with a used bit', async function () {
      const { bitmapIndex, bit } = await nextAvailableBit(this[contract])

      // execute successfully with an available bit
      await execMetaTx({
        contract: this[contract],
        method,
        bitmapIndex,
        bit,
        signer: await getSigner(),
        paramTypes: this.metaBehavior_paramTypes,
        params: this.metaBehavior_params,
        unsignedParams: this.metaBehavior_unsignedParams
      })

      await expect(execMetaTx({
        contract: this[contract],
        method,
        bitmapIndex,
        bit,
        signer: await getSigner(),
        paramTypes: this.metaBehavior_paramTypes,
        params: this.metaBehavior_params,
        unsignedParams: this.metaBehavior_unsignedParams
      })).to.be.revertedWith('MetaTxBase: bit is used')
    })
  })
}

const shouldBehaveLikeMetaTransaction = (contractMethod) => {
  shouldFn(contractMethod)
}
shouldBehaveLikeMetaTransaction.only = (contractMethod) => {
  shouldFn(contractMethod, true)
}

module.exports = {
  shouldBehaveLikeMetaTransaction
}
