// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./MetaTxBase.sol";

/**
 * @dev Logic for account call and delegatecall meta transaction execution functions
 *
 * Not deployed. Extends AccountLogic.sol
 *
 * Each function has a unique "typehash", which is included in the signed message.
 * This ensures that signed message data is executable only by the signed function.
 *
 * `bitmapIndex` and `bit` parameters are used for replay protection. See the
 * "BitFlip" solution https://github.com/anydotcrypto/metatransactions/blob/0547b4e6e9e3356e0a123ecca9fef244e83fca8f/src/contracts/account/ReplayProtection.sol
 *
 */
contract MetaCallLogic is MetaTxBase {
  // keccak256("ExecuteCall(uint256 bitmapIndex,uint256 bit,uint256 value,address to,bytes data)")
  bytes32 internal constant EXECUTE_CALL_TYPEHASH = 0xd932305af552a4aaf503e660b0773c193665c015551ee979554592990cb52294;

  // keccak256("ExecuteDelegateCall(uint256 bitmapIndex,uint256 bit,address to,bytes data)")
  bytes32 internal constant EXECUTE_DELEGATE_CALL_TYPEHASH = 0xea2c222fbbe5ab043d91c49486bce710d7c8ab554e691ceede0ac7eb50830b83;

  // keccak256("ExecutePartialSignedDelegateCall(uint256 bitmapIndex,uint256 bit,address to,bytes data)")
  bytes32 internal constant EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_TYPEHASH = 0x9011888bb29eb2e45ac6ec89389673da43ae164b0b19b4522086bc654088da17;

  /**
   * @dev Executes the call `data` on the contract at address `to`, sending `value`
   * amount of Eth.
   *
   * NOTE: This "meta transaction" can be executed by any address, as long as a valid
   * signature from a proxy owner is provided.
   *
   * Requirements:
   *
   * - `signer` recovered from hashed data and `signature` must be a proxy owner
   * - the contract must have a balance of at least `value` Eth
   * - the `data` executed on the `to` contract must succeed
   * - If `value` is not 0, the `to` address must be a payable address
   */
  function executeCall(
    uint256 bitmapIndex, uint256 bit,
    uint256 value, address to, bytes memory data,
    bytes memory signature
  )
    public
  {
    address signer = _metaTx(
      bitmapIndex, bit,
      keccak256(abi.encode(
        EXECUTE_CALL_TYPEHASH, bitmapIndex, bit, value, to, keccak256(data)
      )),
      signature
    );
    require(_isProxyOwner(signer), "MetaCallLogic: executeCall signer is not proxyOwner");

    assembly {
      let result := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /**
   * @dev Executes the delegatecall `data` on the contract at address `to`
   *
   * NOTE: This "meta transaction" can be executed by any address, as long as a valid
   * signature from a proxy owner is provided.
   *
   * Requirements:
   *
   * - `signer` recovered from hashed data and `signature` must be a proxy owner
   * - the `data` executed on the `to` contract must succeed
   * 
   */
  function executeDelegateCall(
    uint256 bitmapIndex, uint256 bit,
    address to, bytes memory data,
    bytes memory signature
  )
    public
  {
    address signer = _metaTx(
      bitmapIndex, bit,
      keccak256(abi.encode(
        EXECUTE_DELEGATE_CALL_TYPEHASH, bitmapIndex, bit, to, keccak256(data)
      )),
      signature
    );
    require(_isProxyOwner(signer), "MetaCallLogic: executeDelegateCall signer is not proxyOwner");

    assembly {
      let result := delegatecall(gas(), to, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /**
   * @dev Executes a delegatecall with `data` and `unsignedData` on the contract
   * at address `to`. `data` is included in the signature and signed message,
   * `unsignedData` is not.
   *
   * NOTE: This "meta transaction" can be executed by any address, as long as a valid
   * signature from a proxy owner is provided.
   *
   * Requirements:
   *
   * - `signer` recovered from hashed data and `signature` must be a proxy owner
   * - the `callData` executed on the `to` contract must succeed
   * 
   */
  function executePartialSignedDelegateCall(
    uint256 bitmapIndex, uint256 bit,
    address to, bytes memory data,
    bytes memory signature,
    bytes memory unsignedData
  )
    public
  {
    address signer = _metaTx(
      bitmapIndex, bit,
      keccak256(abi.encode(
        EXECUTE_PARTIAL_SIGNED_DELEGATE_CALL_TYPEHASH, bitmapIndex, bit, to, keccak256(data)
      )),
      signature
    );
    require(_isProxyOwner(signer), "MetaCallLogic: executePartialSignedDelegateCall signer is not proxyOwner");

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
