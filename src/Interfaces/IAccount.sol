// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

interface IAccount {
  error NotOwner(address signer);
  error InvalidSignature(bytes32 hash, bytes signature);
  error NotDelegateCall();
  function externalCall(uint256 value, address to, bytes memory data) external;
  function delegateCall(address to, bytes memory data) external;
  function metaDelegateCall(address to, bytes calldata data, bytes calldata signature, bytes calldata unsignedData) external;
  function metaDelegateCall_EIP1271(address to, bytes calldata data, bytes calldata signature, bytes calldata unsignedData) external;
}
