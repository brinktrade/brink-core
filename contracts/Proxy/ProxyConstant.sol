// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

/**
 * @dev constant storage pointers and EIP712Domain hash for Proxy
 */
contract ProxyConstant {
  // keccak256("Proxy.domainSeparator")
  // Storage position of the domain separator hash, used for EIP712 signed messages
  bytes32 internal constant DOMAIN_SEPARATOR_PTR = 0xdf3eb0f0d40d76e4ff48aba1bcf4c2cbe5048b2782cf50dc9c3a6d46f6323535;

  // keccak256("Proxy.implementation")
  // Storage position of the address of the current implementation
  bytes32 internal constant IMPLEMENTATION_PTR = 0x572ba385c24852168ee0dddbfd13b0548b4a3d5fce523e6e03d46ca6e7810192;

  // keccak256("Proxy.owner")
  // Storage position of the proxy owner address
  bytes32 internal constant OWNER_PTR = 0xefcaeeb11255bad8bdb9af76f6e0218b2d8f35a60a9cc14c26f461f277af7bae;

  // keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
  // hash of EIP712Domain type
  bytes32 internal constant EIP712_DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
}
