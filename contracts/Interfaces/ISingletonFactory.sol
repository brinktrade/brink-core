// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

interface ISingletonFactory {
  function deploy(bytes memory _initCode, bytes32 _salt) external returns (address payable createdContract);
}
