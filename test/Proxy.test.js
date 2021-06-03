// TODO: Re-test without using ProxyAdminDelegated, which has been moved
// to @brinkninja/verifiers

// const { expect } = require('chai')
// const { ethers } = require('hardhat')
// const { constants, expectRevert } = require('@openzeppelin/test-helpers')
// const { ZERO_ADDRESS } = constants
// const encodeFunctionCall = require('./helpers/encodeFunctionCall')
// const testMetaTxEndpoint = require('./helpers/testMetaTxEndpoint')
// const { setupTokens } = require('./helpers/setup')
// const { execMetaTx, nextAvailableBit } = require('./helpers/metaTx')
// const { BN } = require('./helpers/bignumber')

// async function getSigners () {
//   const [ a, proxyOwner, tokenOwner, anotherAccount, proxyDeployer ] = await ethers.getSigners()
//   return { proxyOwner, tokenOwner, anotherAccount, proxyDeployer }
// }

// async function getSigner (signerName) {
//   const fn = getSignerFn(signerName)
//   const signer = await fn()
//   return signer
// }

// function getSignerFn (signerName) {
//   return async function () {
//     const signer = (await getSigners())[signerName]
//     return signer
//   }
// }

// const chainId = 1

// const _executeDelegateCallParamTypes = [
//   { name: 'to', type: 'address' },
//   { name: 'data', type: 'bytes' }
// ]

// describe('Proxy using MetaCallLogic and ProxyAdminDelegated functions', function () {

//   // Test a Proxy that uses a MetaCallLogic implementation to `executeDelegateCall` to admin
//   // functions on a ProxyAdminDelegated instance

//   beforeEach(async function () {
//     this.proxyOwner = await getSigner('proxyOwner')
//     this.tokenOwner = await getSigner('tokenOwner')
//     this.anotherAccount = await getSigner('anotherAccount')
//     this.proxyDeployer = await getSigner('proxyDeployer')

//     const Proxy = (await ethers.getContractFactory('Proxy')).connect(this.proxyDeployer)
//     const ProxyAdminDelegated = await ethers.getContractFactory('ProxyAdminDelegated')
//     const TestMetaProxy = await ethers.getContractFactory('TestMetaProxy')
//     const MetaCallLogic = await ethers.getContractFactory('MetaCallLogic')
//     const TestToken_V0 = await ethers.getContractFactory('TestToken_V0')
//     const TestToken_V1 = await ethers.getContractFactory('TestToken_V1')

//     const { tokenA } = await setupTokens()
//     this.tokenA = tokenA
//     this.proxyAdminDelegated = await ProxyAdminDelegated.deploy()
//     this.impl_init = await MetaCallLogic.deploy()
//     this.impl_v0 = await TestToken_V0.deploy()
//     this.impl_v1 = await TestToken_V1.deploy()
//     const proxy = await Proxy.deploy(this.impl_init.address, this.proxyOwner.address, chainId)

//     // use TestMetaProxy here so all events/functions for MetaCallLogic and ProxyAdminDelegated
//     // are accessible on `this.proxy`
//     this.proxy = await TestMetaProxy.attach(proxy.address)

//     this.token_v0 = await TestToken_V0.attach(this.proxy.address)
//     this.token_v1 = await TestToken_V1.attach(this.proxy.address)
//   })

//   describe('constructor', function () {
//     it('should set proxyOwner', async function () {
//       const isOwner = await this.proxy.isProxyOwner(this.proxyOwner.address)
//       expect(isOwner).to.be.equal(true)
//     })
//     it('should set implementation', async function () {
//       const owner = await this.proxy.implementation()
//       expect(owner).to.be.equal(this.impl_init.address)
//     })
//   })

//   describe('add a new proxy owner', function () {
//     beforeEach(async function () {
//       this.newOwnerAddress = this.anotherAccount.address
//       this.successCallData = encodeFunctionCall('addProxyOwner', ['address'], [this.newOwnerAddress])
//       this.existingOwnerCallData = encodeFunctionCall('addProxyOwner', ['address'], [this.proxyOwner.address])
//       this.zeroAddressOwnerCallData = encodeFunctionCall('addProxyOwner', ['address'], [ZERO_ADDRESS])
//     })

//     testMetaTxEndpoint.call(this, {
//       contract: 'proxy',
//       method: 'executeDelegateCall',
//       paramTypes: _executeDelegateCallParamTypes,
//       conditions: [
//         {
//           describe: 'when tx succeeds',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.successCallData ]
//           },
//           testFn: function () {
//             it('adds the new owner', async function () {
//               expect(await this.proxy.isProxyOwner(this.newOwnerAddress)).to.be.equal(true)
//             })
//           }
//         },
//         {
//           describe: 'when tx succeeds',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.successCallData ]
//           },
//           testFnWithoutSend: function () {      
//             it('emits an OwnerAdded event', async function () {
//               const { promise } = await this.txCall()
//               await expect(promise).to.emit(this.proxy, 'OwnerAdded').withArgs(this.newOwnerAddress)
//             })
//           }
//         },
//         {
//           describe: 'when the new owner is already added',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.existingOwnerCallData ]
//           },
//           expectRevert: 'ProxyAdminDelegated: addOwner with existing owner'
//         },
//         {
//           describe: 'when the new owner is the zero address',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.zeroAddressOwnerCallData ]
//           },
//           expectRevert: 'ProxyAdminDelegated: addOwner with zero address'
//         }
//       ]
//     })
//   })

//   describe('remove a proxy owner', function () {
//     beforeEach(async function () {
//       const newOwnerAddress = this.anotherAccount.address
//       this.successCallData = encodeFunctionCall('removeProxyOwner', ['address'], [this.proxyOwner.address])
//       this.notExistingOwnerCallData = encodeFunctionCall('removeProxyOwner', ['address'], [newOwnerAddress])
//     })

//     testMetaTxEndpoint.call(this, {
//       contract: 'proxy',
//       method: 'executeDelegateCall',
//       paramTypes: _executeDelegateCallParamTypes,
//       conditions: [
//         {
//           describe: 'when tx succeeds',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.successCallData ]
//           },
//           testFn: function () {
//             it('removes the owner', async function () {
//               expect(await this.proxy.isProxyOwner(this.proxyOwner.address)).to.be.equal(false)
//             })
//           }
//         },
//         {
//           describe: 'when tx succeeds',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.successCallData ]
//           },
//           testFnWithoutSend: function () {      
//             it('emits an OwnerRemoved event', async function () {
//               const { promise } = await this.txCall()
//               await expect(promise).to.emit(this.proxy, 'OwnerRemoved').withArgs(this.proxyOwner.address)
//             })
//           }
//         },
//         {
//           describe: 'when the owner does not exist',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.notExistingOwnerCallData ]
//           },
//           expectRevert: 'ProxyAdminDelegated: removeOwner with owner that does not exist'
//         }
//       ]
//     })
//   })

//   describe('upgrade implementation', function () {
//     beforeEach(async function () {
//       this.successCallData = encodeFunctionCall('upgradeTo', ['address'], [this.impl_v0.address])
//       this.zeroAddressImplCallData = encodeFunctionCall('upgradeTo', ['address'], [ZERO_ADDRESS])
//       this.unchangedImplCallData = encodeFunctionCall('upgradeTo', ['address'], [this.impl_init.address])
//     })

//     testMetaTxEndpoint.call(this, {
//       contract: 'proxy',
//       method: 'executeDelegateCall',
//       paramTypes: _executeDelegateCallParamTypes,
//       conditions: [
//         {
//           describe: 'when the given implementation is different than the current one',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.successCallData ]
//           },
//           testFn: function () {
//             it('upgrades to the given implementation', async function () {
//               const implementation = await this.proxy.implementation()
//               expect(implementation).to.be.equal(this.impl_v0.address)
//             })
//           }
//         },
//         {
//           describe: 'when the given implementation is a zero address',
//           getSigner: getSignerFn('proxyOwner'),
//           paramsFn: function () {
//             return [ this.proxyAdminDelegated.address, this.zeroAddressImplCallData ]
//           },
//           expectRevert: 'ProxyAdminDelegated: upgradeTo with zero address implementation'
//         }
//       ]
//     })
//   })

//   describe('delegatecall', function () {
//     beforeEach(async function () {
//       const TestToken_V0 = await ethers.getContractFactory('TestToken_V0')
//       this.senderAddress = this.anotherAccount.address
//       this.tokenOwnerAddress = this.tokenOwner.address
//       const upgradeCallData = encodeFunctionCall(
//         'upgradeTo', ['address'], [this.impl_v0.address]
//       )
//       const { bitmapIndex, bit } = await nextAvailableBit(this.proxy)
//       await execMetaTx({
//         contract: this.proxy,
//         method: 'executeDelegateCall',
//         bitmapIndex,
//         bit,
//         signer: await getSigner('proxyOwner'),
//         paramTypes: _executeDelegateCallParamTypes,
//         params: [ this.proxyAdminDelegated.address, upgradeCallData ]
//       })

//       // setting owner in an unsigned public tx wouldn't be safe, just
//       // doing this to setup tests
//       const tkn0 = await TestToken_V0.attach(this.proxy.address)
//       await tkn0.initialize(this.tokenOwnerAddress)
//       this.token_v0 = await TestToken_V0.attach(this.proxy.address).connect(this.tokenOwner)
//     })

//     describe('when there were no further upgrades', function () {
//       it('delegates calls to the initial implementation', async function() {
//         await this.token_v0.mint(this.senderAddress, BN(100))

//         const balance = await this.token_v0.balanceOf(this.senderAddress)
//         expect(balance).to.equal(BN(100))

//         const totalSupply = await this.token_v0.totalSupply()
//         expect(totalSupply).to.equal(BN(100))
//       })

//       it('fails when trying to call an unknown function of the current implementation', async function () {
//         await this.token_v0.mint(this.senderAddress, BN(100))

//         await expectRevert(
//           this.token_v1.burn(BN(20)),
//           'revert'
//         )
//       })
//     })

//     describe('when there was another upgrade', function () {
//       beforeEach(async function () {
//         this.senderAddress = this.anotherAccount.address
//         this.tokenOwnerAddress = this.tokenOwner.address
//         const upgradeCallData = encodeFunctionCall(
//           'upgradeTo', ['address'], [this.impl_v1.address]
//         )
        
//         await this.token_v0.mint(this.senderAddress, BN(100), { from: this.tokenOwnerAddress })
//         const { bitmapIndex, bit } = await nextAvailableBit(this.proxy)
//         await execMetaTx({
//           contract: this.proxy,
//           method: 'executeDelegateCall',
//           bitmapIndex,
//           bit,
//           signer: await getSigner('proxyOwner'),
//           paramTypes: _executeDelegateCallParamTypes,
//           params: [ this.proxyAdminDelegated.address, upgradeCallData ]
//         })

//         const TestToken_V1 = await ethers.getContractFactory('TestToken_V1')
//         this.token_v1_owner = await TestToken_V1.attach(this.proxy.address).connect(this.tokenOwner)
//         this.token_v1_sender = await TestToken_V1.attach(this.proxy.address).connect(this.anotherAccount)
//       })

//       it('delegates calls to the last upgraded implementation', async function() {
//         await this.token_v1_owner.mint(this.senderAddress, BN(20))
//         await expectRevert(
//           this.token_v1_sender.mint(this.senderAddress, BN(20)),
//           'TestOwnable: msg.sender is not owner'
//         )
//         await this.token_v1_sender.burn(BN(40))

//         const balance = await this.token_v1.balanceOf(this.senderAddress)
//         expect(balance).to.equal(BN(80))

//         const totalSupply = await this.token_v1.totalSupply()
//         expect(totalSupply).to.equal(BN(80))
//       })
//     })
//   })
// })
