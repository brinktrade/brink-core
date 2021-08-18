// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

interface IERC1271 {
  function isValidSignature(bytes32 _hash, bytes memory _signature) external view returns (bytes4 magicValue);
}
