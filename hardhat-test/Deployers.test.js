const { ethers } = require('hardhat')
const { expect } = require('chai')
const { deploySingletonFactory } = require('./helpers')

describe('Deployers', function () {
  describe('SaltedDeployer', function () {
    beforeEach(async function () {
      await deploySingletonFactory()
      const SaltedDeployer = await ethers.getContractFactory('SaltedDeployer')
      this.saltedDeployer = await SaltedDeployer.deploy()
    })

    it('when initCode is valid and not deployed, should deploy the initCode', async function () {
      const TestEmptyCall = await ethers.getContractFactory('TestEmptyCall')
      const expectedDeployAddress = await this.saltedDeployer.getDeployAddress(TestEmptyCall.bytecode)
      await this.saltedDeployer.deploy(TestEmptyCall.bytecode)
      expect(await ethers.provider.getCode(expectedDeployAddress)).not.to.equal('0x')
    })

    it('when initCode is invalid, should revert with \'DeployFailed()\'', async function () {
      expect(this.saltedDeployer.deploy('0x99')).to.be.revertedWith('DeployFailed()')
    })

    it('when initCode was already deployed, should revert with \'DeploymentExists()\'', async function () {
      const TestAccountCalls = await ethers.getContractFactory('TestAccountCalls')
      await this.saltedDeployer.deploy(TestAccountCalls.bytecode)
      expect(this.saltedDeployer.deploy(TestAccountCalls.bytecode)).to.be.revertedWith('DeploymentExists()')
    })
  })
})
