// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.6;

import "../Interfaces/IERC1271.sol";

/// @title Provides a validation check on a signer contract that implements EIP-1271
/// @notice https://github.com/ethereum/EIPs/issues/1271
contract EIP1271Validator {

  // bytes4(keccak256("isValidSignature(bytes32,bytes)")
  bytes4 constant internal MAGICVALUE = 0x1626ba7e;

  /**
   * @dev Should return whether the signature provided is valid for the provided hash
   * @param signer Address of a contract that implements EIP-1271
   * @param hash Hash of the data to be validated
   * @param signature Signature byte array associated with hash
   */ 
  function _isValidSignature(address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
    return IERC1271(signer).isValidSignature(hash, signature) == MAGICVALUE;
  }
}
