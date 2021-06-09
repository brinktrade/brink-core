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

    this.addSignerAsExecutor = async function (signerIndex) {
      const signer = (await ethers.getSigners())[signerIndex]
      await this.executorAccessController.connect(this.adminAccount)
        .addExecutor(signer.address, (await getAddExecutorSignature(signer)).signature)
    }

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

    it('Allows owner to change max number of executors per admin', async function() {
      await this.executorAccessController.connect(this.ownerAccount).modifyMaxExecutorsPerAdmin(20)
      expect(await this.executorAccessController.maxExecutorsPerAdmin()).to.equal(20)
    })

    it('Allows owner to add more executors than the max per admin', async function() {
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000000')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000001')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000002')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000003')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000004')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000005')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000006')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000007')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000008')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x0000000000000000000000000000000000000009')
      await this.executorAccessController.connect(this.ownerAccount).addExecutorWithoutSignature('0x000000000000000000000000000000000000000a')
      expect(await this.executorAccessController.adminExecutorCount(this.ownerAccount.address)).to.equal(0)
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
      expect(await this.executorAccessController.adminExecutorCount(this.adminAccount.address)).to.equal(1)
      await this.executorAccessController.connect(this.adminAccount).removeExecutor(this.executorAccount.address)
      expect(await this.executorAccessController.isExecutor(this.executorAccount.address)).to.equal(false)
      expect(await this.executorAccessController.adminExecutorCount(this.adminAccount.address)).to.equal(0)
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

    it('Prevents admin from adding more executors than the maximum, reverts with \'EXECUTOR_MAX_EXCEEDED\'',
      async function()
    {
      const maxExecutors = 10
      for (let i = 0; i < maxExecutors; i++) {
        await this.addSignerAsExecutor(i)
      }
      await expect(this.addSignerAsExecutor(11)).to.be.revertedWith('EXECUTOR_MAX_EXCEEDED')
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

    it('Prevents admin from changing max number of executors per admin, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.adminAccount).modifyMaxExecutorsPerAdmin(200))
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

    it('Prevents random account from changing max number of executors per admin, reverts with \'NOT_CONTRACT_OWNER\'', async function() {
      await expect(this.executorAccessController.connect(this.randomAccount).modifyMaxExecutorsPerAdmin(200))
        .to.be.revertedWith('NOT_CONTRACT_OWNER')
    })
  })
})