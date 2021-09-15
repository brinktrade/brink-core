// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.6;

import "../Proxy/ProxyGettable.sol";
import "./EIP712SignerRecovery.sol";
import "./EIP1271Validator.sol";

/// @title Brink account core
/// @notice Deployed once and used by many Proxy contracts as the implementation contract
contract Account is ProxyGettable, EIP712SignerRecovery, EIP1271Validator {
  /// @dev Typehash for signed metaDelegateCall() messages
  /// @dev keccak256("MetaDelegateCall(address to,bytes data)")
  bytes32 internal constant META_DELEGATE_CALL_TYPEHASH =
    0x023ce5d01636bb12b4ffde3c4f5a66fb1044aa0dbc251394e60f0a26f1591043;

  /// @dev Typehash for signed metaDelegateCall() messages
  /// @dev keccak256("MetaDelegateCall_EIP1271(address to,bytes data)")
  bytes32 internal constant META_DELEGATE_CALL_EIP1271_TYPEHASH =
    0x1d3b50d88adeb95016e86033ab418b64b7ecd66b70783b0dca7b0afc8bfb8a1e;

  /// @dev Constructor sets CHAIN_ID immutable constant
  constructor(uint256 chainId_) EIP712SignerRecovery(chainId_) { }

  /// @dev Loads bytes32 data stored at the given pointer
  /// @param ptr The pointer to the bytes32 data
  function storageLoad(bytes32 ptr) external view returns (bytes32 data) {
    assembly { data := sload(ptr) }
  }

  /// @dev Makes a call to an external contract
  /// @dev Only executable directly by the proxy owner
  /// @param value Amount of wei to send with the call
  /// @param to Address of the external contract to call
  /// @param data Call data to execute
  function externalCall(uint256 value, address to, bytes memory data) external {
    require(proxyOwner() == msg.sender, "NOT_OWNER");
    assembly {
      let result := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /// @dev Makes a delegatecall to an external contract
  /// @param to Address of the external contract to delegatecall
  /// @param data Call data to execute
  function delegateCall(address to, bytes memory data) external {
    require(proxyOwner() == msg.sender, "NOT_OWNER");
    assembly {
      let result := delegatecall(gas(), to, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /// @dev Allows execution of a delegatecall with a valid signature from the proxyOwner. Uses EIP-712
  /// (https://github.com/ethereum/EIPs/pull/712) signer recovery.
  /// @param to Address of the external contract to delegatecall, signed by the proxyOwner
  /// @param data Call data to include in the delegatecall, signed by the proxyOwner
  /// @param signature Signature of the proxyOwner
  /// @param unsignedData Unsigned call data appended to the delegatecall
  /// @notice WARNING: The `to` contract is responsible for secure handling of the call provided in the encoded
  /// `callData`. If the proxyOwner signs a delegatecall to a malicious contract, this could result in total loss of
  /// their account.
  function metaDelegateCall(
    address to, bytes memory data, bytes memory signature, bytes memory unsignedData
  ) external {
    address signer = _recoverSigner(
      keccak256(abi.encode(META_DELEGATE_CALL_TYPEHASH, to, keccak256(data))),
      signature
    );
    require(proxyOwner() == signer, "NOT_OWNER");

    bytes memory callData = abi.encodePacked(data, unsignedData);

    assembly {
      let result := delegatecall(gas(), to, add(callData, 0x20), mload(callData), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /// @dev Allows execution of a delegatecall if proxyOwner is a smart contract. Uses EIP-1271
  /// (https://eips.ethereum.org/EIPS/eip-1271) signer validation.
  /// @param to Address of the external contract to delegatecall, validated by the proxyOwner contract
  /// @param data Call data to include in the delegatecall, validated by the proxyOwner contract
  /// @param signature Signature that will be validated by the proxyOwner contract
  /// @param unsignedData Unsigned call data appended to the delegatecall
  /// @notice WARNING: The `to` contract is responsible for secure handling of the call provided in the encoded
  /// `callData`. If the proxyOwner contract validates a delegatecall to a malicious contract, this could result in
  /// total loss of the account.
  function metaDelegateCall_EIP1271(
    address to, bytes memory data, bytes memory signature, bytes memory unsignedData
  ) external {
    require(_isValidSignature(
      proxyOwner(),
      keccak256(abi.encode(META_DELEGATE_CALL_EIP1271_TYPEHASH, to, keccak256(data))),
      signature
    ), "INVALID_SIGNATURE");

    bytes memory callData = abi.encodePacked(data, unsignedData);

    assembly {
      let result := delegatecall(gas(), to, add(callData, 0x20), mload(callData), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }
}
