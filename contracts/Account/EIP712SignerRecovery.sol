// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";

/// @title Provides signer address recovery for EIP-712 signed messages
/// @notice https://github.com/ethereum/EIPs/pull/712
contract EIP712SignerRecovery {

  uint256 internal immutable CHAIN_ID;

  constructor (uint256 chainId_) {
    CHAIN_ID = chainId_;
  }

  /// @dev Recovers the signer address for an EIP-712 signed message
  /// @param dataHash Hash of the data included in the message
  /// @param signature An EIP-712 signature
  function _recoverSigner(bytes32 dataHash, bytes memory signature) internal view returns (address) {
    // generate the hash for the signed message
    bytes32 messageHash = keccak256(abi.encodePacked(
      "\x19\x01",
      // hash the EIP712 domain separator
      keccak256(abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256("BrinkAccount"),
        keccak256("1"),
        CHAIN_ID,
        address(this)
      )),
      dataHash
    ));

    // recover the signer address from the signed messageHash and return
    return ECDSA.recover(messageHash, signature);
  }
}
