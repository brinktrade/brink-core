// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

import "../Interfaces/ISingletonFactory.sol";
import "../Access/ExecutorAccessController.sol";

/**
 * @dev Contract for batching CREATE2 contract deployment and an initial call into 1 tx
 */
contract DeployAndExecute {
  ISingletonFactory singletonFactory;

  ExecutorAccessController executorAccessController;


  /**
  * @dev The constructor sets a SingletonFactory
  */
  constructor(ISingletonFactory _singletonFactory, ExecutorAccessController _executorAccessController) {
    singletonFactory = _singletonFactory;
    executorAccessController = _executorAccessController;
  }

 /**
  * @dev Deploys a contract with SingletonFactory (https://eips.ethereum.org/EIPS/eip-2470)
  * and executes a call on the newly created contract
  */
  function deployAndExecute(bytes memory initCode, bytes32 salt, bytes memory execData) external {
    
    // Revert if msg.sender is not an executor
    require(executorAccessController.isExecutor(msg.sender), "EXECUTOR_NOT_ALLOWED");

    // Deploy contract with SingletonFactory
    address createdContract = singletonFactory.deploy(initCode, salt);

    // Revert if contract was not deployed
    require(createdContract != address(0), "DeployAndExecute: contract not deployed");

    // Execute a call (with execData) on the newly deployed contract
    assembly {
      let result := call(gas(), createdContract, 0, add(execData, 0x20), mload(execData), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }
}
