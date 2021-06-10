// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "../Proxy/ProxyGettable.sol";

/// @title Provides signer address recovery for EIP-712 signed messages
/// @notice https://github.com/ethereum/EIPs/pull/712
contract EIP712SignerRecovery is ProxyGettable {
  /// @dev Stores the domain separator for EIP-712 messages
  /// @param contractName The name of this contract
  /// @param contractVersion The version of this contract
  /// @param chainId_ ID for this chain to ensure that EIP-712 can't be replayed on other chains
  function _storeDomainSeparator (bytes memory contractName, bytes memory contractVersion, uint256 chainId_)
    internal
  {
    bytes32 domainSeparator = keccak256(abi.encode(
      EIP712_DOMAIN_TYPEHASH,
      keccak256(contractName),
      keccak256(contractVersion),
      chainId_,
      address(this)
    ));
    assembly {
      sstore(DOMAIN_SEPARATOR_PTR, domainSeparator)
    }
  }

  /// @dev Recovers the signer address for an EIP-712 signed message
  /// @param dataHash Hash of the data included in the message
  /// @param signature An EIP-712 signature
  function _recoverSigner(bytes32 dataHash, bytes memory signature) internal view returns (address signer) {
    // generate the hash for the signed message
    bytes32 messageHash = keccak256(abi.encodePacked(
      "\x19\x01",
      _domainSeparator(),
      dataHash
    ));

    // recover the signer address from the signed messageHash and return
    signer = ECDSA.recover(messageHash, signature);
  }
}
