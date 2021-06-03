const {
  testMetaTxEndpoint, BN, chaiSolidity
} = require('@brinkninja/test-helpers')
const { shouldBehaveLikeMetaTransaction } = require('./MetaTransaction.behavior.js')
const { setupMetaAccount, paramTypes, getSigners } = require('./helpers')
const { CANCEL_PARAM_TYPES } = paramTypes
const { expect } = chaiSolidity()

function getSignerFn (signerName) {
  return async function () {
    const signer = (await getSigners())[signerName]
    return signer
  }
}

describe('MetaCancelLogic', function () {
  beforeEach(async function () {
    const { metaAccount } = await setupMetaAccount()
    this.metaAccount = metaAccount
  })

  describe('cancel', function () {
    beforeEach(async function () {
      this.metaBehavior_paramTypes = CANCEL_PARAM_TYPES
      this.metaBehavior_params = []
    })

    shouldBehaveLikeMetaTransaction({
      contract: 'metaAccount',
      method: 'cancel',
      getSigner: getSignerFn('metaAccountOwner')
    })

    testMetaTxEndpoint.call(this, {
      contract: 'metaAccount',
      method: 'cancel',
      paramTypes: CANCEL_PARAM_TYPES,
      conditions: [
        {
          describe: 'when given a valid cancel signature and call',
          getSigner: getSignerFn('metaAccountOwner'),
          unsignedParamsFn: function () { return [] },
          paramsFn: function () { return [] },
          testFn: function () {
            it('should successfully execute and flip the bit', async function () {
              const bitmap = await this.metaAccount.getReplayProtectionBitmap(0)
              expect(bitmap).to.equal(1)
            })
          }
        }
      ]
    })
  })
})
