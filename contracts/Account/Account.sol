// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "../Called/CallExecutable.sol";
import "../Proxy/ProxyGettable.sol";
import "../Access/ExecutorAccessController.sol";

/// @title Brink account core
/// @notice Deployed once and used by many Proxy contracts as the implementation contract
/// @notice Uses EIP712 typed data signing standard https://github.com/ethereum/EIPs/pull/712
contract Account is CallExecutable, ProxyGettable, ExecutorAccessController {

  /// @dev Typehash for signed metaCall() messages
  /// @dev keccak256("MetaCall(uint256 value,address to,bytes data)")
  bytes32 internal constant META_CALL_TYPEHASH =
    0x2bba4f9d81b9b6e314b3217264746dfc8a8cf3be0736581e3d50b529a9f3d10a;

  /// @dev Typehash for signed metaDelegateCall() messages
  /// @dev keccak256("MetaDelegateCall(address to,bytes data)")
  bytes32 internal constant META_DELEGATE_CALL_TYPEHASH =
    0x023ce5d01636bb12b4ffde3c4f5a66fb1044aa0dbc251394e60f0a26f1591043;

  /// @dev Typehash for signed metaPartialSignedDelegateCall() messages
  /// @dev keccak256("MetaPartialSignedDelegateCall(address to,bytes data)")
  bytes32 internal constant META_PARTIAL_SIGNED_DELEGATE_CALL_TYPEHASH = 
    0x0266ca6c1eb1acc96144ea62283cc37b45ab1d2f2e603f95733a75df34ee5e73;

  /// @dev Constructor stores the address of the CallExecutor contract
  /// @dev CallExecutor is used as a call proxy to ensure that msg.sender is never the account address
  constructor(CallExecutor callExecutor, address accessControlOwner) 
    ExecutorAccessController(accessControlOwner) 
  {
    _setCallExecutor(callExecutor);
  }

  /// @dev Makes a call to an external contract
  /// @dev Only executable directly by the proxy owner
  /// @param value Amount of wei to send with the call
  /// @param to Address of the external contract to call
  /// @param data Call data to execute
  function externalCall(uint256 value, address to, bytes memory data) external {
    require(_proxyOwner() == msg.sender, "NOT_OWNER");
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
    require(_proxyOwner() == msg.sender, "NOT_OWNER");
    assembly {
      let result := delegatecall(gas(), to, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /// @dev Makes a call to an external contract with message data signed by the proxy owner
  /// @param value Amount of wei to send with the call
  /// @param to Address of the external contract to call
  /// @param data Call data to execute
  /// @param signature Signature of the proxy owner
  function metaCall(uint256 value, address to, bytes memory data, bytes memory signature) external {
    require(_proxyOwner() == msg.sender || ExecutorAccessController(_implementation()).isExecutor(msg.sender), "EXECUTOR_NOT_ALLOWED");
    address signer = _recoverSigner(
      keccak256(abi.encode(META_CALL_TYPEHASH, value, to, keccak256(data))),
      signature
    );
    require(_proxyOwner() == signer, "NOT_OWNER");
    assembly {
      let result := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
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
    require(_proxyOwner() == msg.sender || ExecutorAccessController(_implementation()).isExecutor(msg.sender), "EXECUTOR_NOT_ALLOWED");
    address signer = _recoverSigner(
      keccak256(abi.encode(META_DELEGATE_CALL_TYPEHASH, to, keccak256(data))),
      signature
    );
    require(_proxyOwner() == signer, "NOT_OWNER");

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
    require(_proxyOwner() == msg.sender || ExecutorAccessController(_implementation()).isExecutor(msg.sender), "EXECUTOR_NOT_ALLOWED");
    address signer = _recoverSigner(
      keccak256(abi.encode(META_PARTIAL_SIGNED_DELEGATE_CALL_TYPEHASH, to, keccak256(data))),
      signature
    );
    require(_proxyOwner() == signer, "NOT_OWNER");

    bytes memory callData = abi.encodePacked(data, unsignedData);

    assembly {
      let result := delegatecall(gas(), to, add(callData, 0x20), mload(callData), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /// @dev Recovers the signer address for a signed message
  /// @param dataHash Hash of the data included in the message
  /// @param signature Signature
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
