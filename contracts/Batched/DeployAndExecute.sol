// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

import "../Interfaces/ISingletonFactory.sol";

/**
 * @dev Contract for batching CREATE2 contract deployment and an initial call into 1 tx
 */
contract DeployAndExecute {
  ISingletonFactory immutable singletonFactory;

  /**
  * @dev The constructor sets a SingletonFactory
  */
  constructor(ISingletonFactory _singletonFactory) {
    singletonFactory = _singletonFactory;
  }

 /**
  * @dev Deploys a contract with SingletonFactory (https://eips.ethereum.org/EIPS/eip-2470)
  * and executes a call on the newly created contract
  */
  function deployAndExecute(bytes calldata initCode, bytes32 salt, bytes memory execData) external {
    
    // Deploy contract with SingletonFactory
    address createdContract = singletonFactory.deploy(initCode, salt);

    // Revert if contract was not deployed
    require(createdContract != address(0), "DeployAndExecute: contract not deployed");

    // Execute a call (with execData) on the newly deployed contract
    assembly {
      let result := call(gas(), createdContract, 0, add(execData, 0x20), mload(execData), 0, 0)
      returndatacopy(0, 0, returndatasize())
      switch result
      case 0 {
        revert(0, returndatasize())
      }
      default {
        return(0, returndatasize())
      }
    }
  }
}
