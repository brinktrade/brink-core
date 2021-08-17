// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.7.0;

import "../Called/CallExecutable.sol";
import "../Proxy/ProxyGettable.sol";
import "./EIP712SignerRecovery.sol";

/// @title Brink account core
/// @notice Deployed once and used by many Proxy contracts as the implementation contract
contract Account is ProxyGettable, EIP712SignerRecovery, CallExecutable {
  /// @dev Typehash for signed metaDelegateCall() messages
  /// @dev keccak256("MetaDelegateCall(address to,bytes data)")
  bytes32 internal constant META_DELEGATE_CALL_TYPEHASH =
    0x023ce5d01636bb12b4ffde3c4f5a66fb1044aa0dbc251394e60f0a26f1591043;

  /// @dev Typehash for signed metaPartialSignedDelegateCall() messages
  /// @dev keccak256("MetaPartialSignedDelegateCall(address to,bytes data)")
  bytes32 internal constant META_PARTIAL_SIGNED_DELEGATE_CALL_TYPEHASH = 
    0x0266ca6c1eb1acc96144ea62283cc37b45ab1d2f2e603f95733a75df34ee5e73;

  /// @dev Constructor sets call executor and the owner of ExecutorAccessController
  /// @notice This sets state on the canonical Account contract, not the proxies
  /// @notice Proxy contracts read from canonical Account state through their implementation() address
  /// @param callExecutor Used as a call proxy to ensure that msg.sender is never the account address
  constructor(CallExecutor callExecutor, uint256 chainId_)
    EIP712SignerRecovery(chainId_)
  {
    _setCallExecutor(callExecutor);
  }

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

  /// @dev Makes a delegatecall to an external contract with message data signed by the proxy owner
  /// @param to Address of the external contract to delegatecall
  /// @param data Call data to execute
  /// @param signature Signature of the proxy owner
  function metaDelegateCall(address to, bytes memory data, bytes memory signature) external {
    address signer = _recoverSigner(
      keccak256(abi.encode(META_DELEGATE_CALL_TYPEHASH, to, keccak256(data))),
      signature
    );
    require(proxyOwner() == signer, "NOT_OWNER");

    assembly {
      let result := delegatecall(gas(), to, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /// @dev Makes a delegatecall to an external contract with message data signed by the proxy owner and unsigned data
  /// provided by the executor (msg.sender)
  /// @param to Address of the external contract to delegatecall
  /// @param data Signed call data to include in the delegatecall
  /// @param signature Signature of the proxy owner
  /// @param unsignedData Unsigned call data to include in the delegatecall
  function metaPartialSignedDelegateCall(
    address to, bytes memory data, bytes memory signature, bytes memory unsignedData
  ) external {
    address signer = _recoverSigner(
      keccak256(abi.encode(META_PARTIAL_SIGNED_DELEGATE_CALL_TYPEHASH, to, keccak256(data))),
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
}
