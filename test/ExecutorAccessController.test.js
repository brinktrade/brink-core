const { ethers } = require('hardhat')
const { chaiSolidity, signEIP712 } = require('@brinkninja/test-helpers')
const { expect } = chaiSolidity()

const chainId = 1

describe('ExecutorAccessController', function() {
  beforeEach(async function () {
    const [
      ownerAccount, adminAccount, executorAccount, adminAccount2, executorAccount2, randomAccount
    ] = await ethers.getSigners()
    this.ownerAccount = ownerAccount
    this.adminAccount = adminAccount
    this.executorAccount = executorAccount
    this.adminAccount2 = adminAccount2
    this.executorAccount2 = executorAccount2
    this.randomAccount = randomAccount
    const ExecutorAccessController = await ethers.getContractFactory('ExecutorAccessController')
    const executorAccessController = await ExecutorAccessController.deploy(this.ownerAccount.address, chainId)
    this.executorAccessController = executorAccessController

    this.executorAccountSignature = (await getAddExecutorSignature(this.executorAccount)).signature
    this.executorAccount2Signature = (await getAddExecutorSignature(this.executorAccount2)).signature

    async function getAddExecutorSignature (executor) {
      const { typedData, signature } = await signEIP712({
        signer: executor,
        contractAddress: executorAccessController.address,
        contractName: 'ExecutorAccessController',
        contractVersion: '1',
        chainId,
        method: 'addExecutor',
        paramTypes: [ { name: 'executor', type: 'address'} ],
        params: [ executor.address ]
      })
      return { typedData, signature }
    }
  })

  describe('Owner Actions', function() {
    it('Deploys the contract with specified owner address as owner', async function() {
      expect(await this.executorAccessController.owner()).to.equal(this.ownerAccount.address)
    })

    it('Allows owner to add an admin address', async function() {
      await this.executorAccessController.addAdmin(this.adminAccount.address)
      expect(await this.executorAccessController.isAdmin(this.adminAccount.address)).to.equal(true)
    })

    it('Allows owner to remove an admin address', async function() {
      await this.executorAccessController.addAdmin(this.adminAccount.address)
      expect(await this.executorAccessController.isAdmin(this.adminAccount.address)).to.equal(true)
      await this.executorAccessController.removeAdmin(this.adminAccount.address)
      expect(await this.executorAccessController.isAdmin(this.adminAccount.address)).to.equal(false)
    })

    it('Allows owner to add an executor address without a signature', async function() {
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
    })

    it('Allows owner to remove an executor address added by an admin', async function() {
      await this.executorAccessController.addAdmin(this.adminAccount.address)
      await this.executorAccessController.connect(this.adminAccount)
        .addExecutor(this.executorAccount.address, this.executorAccountSignature)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await this.executorAccessController.connect(this.ownerAccount).removeExecutor(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(false)
    })

    it('Allows owner to remove an executor address added by the owner', async function() {
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await this.executorAccessController.connect(this.ownerAccount).removeExecutor(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(false)
    })

    // TODO: let owner use this function
    // it('Prevents owner from adding an executor address that requires a signature, reverts with: \'NOT_ADMIN\'', async function() {
    //   await expect(this.executorAccessController.addExecutor(this.executorAccount.address))
    //     .to.be.revertedWith('NOT_ADMIN')
    // })
  })

  describe('Admin Actions', function() {
    beforeEach(async function () {
      await this.executorAccessController.addAdmin(this.adminAccount.address)
      await this.executorAccessController.addAdmin(this.adminAccount2.address)
    })
    
    it('Allows admin to add an owned executor address with a valid signature', async function() {
      await this.executorAccessController.connect(this.adminAccount)
        .addExecutor(this.executorAccount.address, this.executorAccountSignature)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
    })

    it('Allows admin to remove an owned executor address', async function() {
      await this.executorAccessController.connect(this.adminAccount)
        .addExecutor(this.executorAccount.address, this.executorAccountSignature)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await this.executorAccessController.connect(this.adminAccount).removeExecutor(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(false)
    })

    it('Prevents admin from adding an admin, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.adminAccount).addAdmin(this.adminAccount2.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })

    it('Prevents admin from removing an owned executor address, reverts with NOT_EXECUTOR_OWNER', async function() {
      await this.executorAccessController.connect(this.ownerAccount)
        .addExecutorWithoutSignature(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await expect(this.executorAccessController.connect(this.adminAccount)
        .removeExecutor(this.executorAccount.address))
        .to.be.revertedWith('NOT_EXECUTOR_OWNER')
    })

    it('Prevents admin from adding an owned executor address, reverts with \'EXECUTOR_EXISTS\'', async function() {
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await expect(this.executorAccessController.connect(this.adminAccount)
        .addExecutor(this.executorAccount.address, this.executorAccountSignature))
        .to.be.revertedWith('EXECUTOR_EXISTS')
    })

    it('Prevents admin from adding an executor address without signature, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.adminAccount).addExecutorWithoutSignature(this.executorAccount.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })

    it('Prevents admin from adding an owned executor address without a valid signature', async function() {
      await expect(this.executorAccessController.connect(this.adminAccount)
        .addExecutor(this.executorAccount.address, this.executorAccount2Signature))
        .to.be.revertedWith('SIGNER_NOT_EXECUTOR')
    })
  })

  describe('Random Account Actions', function() {
    beforeEach(async function () {
      await this.executorAccessController.connect(this.ownerAccount).addAdmin(this.adminAccount.address)
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature(this.executorAccount.address)
    })

    it('Prevents random account from adding an admin address, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.randomAccount).addAdmin(this.adminAccount2.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })

    it('Prevents random account from adding an executor address, reverts with \'NOT_ADMIN\'', async function() {
      await expect(this.executorAccessController.connect(this.randomAccount)
        .addExecutor(this.executorAccount2.address, this.executorAccount2Signature))
        .to.be.revertedWith('NOT_ADMIN')
    })

    it('Prevents random account from removing an admin address, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.randomAccount).removeAdmin(this.adminAccount.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })

    it('Prevents random account from removing an executor address, reverts with \'NOT_EXECUTOR_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.randomAccount).removeExecutor(this.executorAccount.address))
        .to.be.revertedWith('NOT_EXECUTOR_OWNER')
    })

    it('Prevents random account from adding an executor address without signature, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.randomAccount).addExecutorWithoutSignature(this.executorAccount2.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })
  })
})