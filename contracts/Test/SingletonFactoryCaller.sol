// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.6;

import "../Interfaces/ISingletonFactory.sol";

contract SingletonFactoryCaller is ISingletonFactory {

  event Deployed (address payable createdContract, bytes initCode, bytes32 salt);

  ISingletonFactory singletonFactory;

  constructor (ISingletonFactory _singletonFactory) {
    singletonFactory = _singletonFactory;
  }

  function deploy(bytes memory initCode, bytes32 salt) external override returns (address payable createdContract) {
    createdContract = singletonFactory.deploy(initCode, salt);
    require(createdContract != address(0), "SingletonFactoryCaller: deploy failed");
    emit Deployed(createdContract, initCode, salt);
    return createdContract;
  }
}
