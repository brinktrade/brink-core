const { ethers } = require('hardhat')
const { chaiSolidity } = require('@brinkninja/test-helpers')
const { expect } = chaiSolidity()

describe('ExecutorAccessController', function() {
  beforeEach(async function () {
    const [
      ownerAccount, adminAccount, executorAccount , adminAccount2, executorAccount2, randomAccount
    ] = await ethers.getSigners()
    this.ownerAccount = ownerAccount
    this.adminAccount = adminAccount
    this.executorAccount = executorAccount
    this.adminAccount2 = adminAccount2
    this.executorAccount2 = executorAccount2
    this.randomAccount = randomAccount
    const ExecutorAccessController = await ethers.getContractFactory('ExecutorAccessController')
    const executorAccessController = await ExecutorAccessController.deploy(this.ownerAccount.address)
    this.executorAccessController = executorAccessController
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

    // TODO: @Mike, test requires fixing when you add signature to addExecutor
    it.skip('Allows owner to remove an executor address added by an admin', async function() {
      await this.executorAccessController.addAdmin(this.adminAccount.address)
      await this.executorAccessController.connect(this.adminAccount).addExecutor(this.executorAccount.address)
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

    it('Prevents owner from adding an executor address that requires a singature, reverts with: \'NOT_ADMIN\'', async function() {
      await expect(this.executorAccessController.addExecutor(this.executorAccount.address))
        .to.be.revertedWith('NOT_ADMIN')
    })
  })

  describe('Admin Actions', function() {
    beforeEach(async function () {
      await this.executorAccessController.addAdmin(this.adminAccount.address)
      await this.executorAccessController.addAdmin(this.adminAccount2.address)
    })
    
    // TODO: @Mike, test requires fixing when you add signature to addExecutor
    it.skip('Allows admin to add an owned executor address', async function() {
      await this.executorAccessController.connect(this.adminAccount).addExecutor(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
    })

    // TODO: @Mike, test requires fixing when you add signature to addExecutor
    it.skip('Allows admin to remove an owned executor address', async function() {
      await this.executorAccessController.connect(this.adminAccount).addExecutor(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await this.executorAccessController.connect(this.adminAccount).removeExecutor(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(false)
    })

    it('Prevents admin from adding an admin, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.adminAccount).addAdmin(this.adminAccount2.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })

    it('Prevents admin from removing an owned executor address, reverts with \'ExecutorAccessController: Admin cannot remove an executor they did not add\'', async function() {
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await expect(this.executorAccessController.connect(this.adminAccount).removeExecutor(this.executorAccount.address))
        .to.be.revertedWith('NOT_EXECUTOR_OWNER')
    })

    // TODO: @Mike, test *potentially* (revert message specifically) requires fixing when you add signature to addExecutor
    it.skip('Prevents admin from adding an owned executor address, reverts with \'EXECUTOR_EXISTS\'', async function() {
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(true)
      await expect(this.executorAccessController.connect(this.adminAccount).addExecutor(this.executorAccount.address))
        .to.be.revertedWith('EXECUTOR_EXISTS')
    })

    it('Prevents admin from adding an executor address without singature, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.adminAccount).addExecutorWithoutSignature(this.executorAccount.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
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
      await expect(this.executorAccessController.connect(this.randomAccount).addExecutor(this.executorAccount2.address))
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

    it('Prevents random account from adding an executor address without singature, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.randomAccount).addExecutorWithoutSignature(this.executorAccount2.address))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })
  })
})