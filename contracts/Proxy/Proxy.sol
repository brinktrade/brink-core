// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

import "./ProxyStorage.sol";

/**
 * @dev Proxy is deployed for each unique Brink account.
 *
 * The contract follows a standard "upgradable" pattern. It's fallback function
 * proxies all calls (via delegatecall) to the contract deployed at the
 * `implementation` address. For the initial version, `implementation` is
 * an instance of Account.sol. The `implementation` can be changed only by
 * `proxyOwner` (aka the Brink user who owns this account).
 */
contract Proxy is ProxyStorage {
  /**
  * @dev The constructor sets `proxyOwner`
  */
  constructor(address proxyOwner) {
    _owner = proxyOwner;
  }

 /**
  * @dev Fallback function performs a delegatecall to the implementation contract.
  * This function will return whatever the implementation call returns, or revert
  * if the implementation call reverts.
  */
  fallback() external payable {
    assembly {
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), ACCOUNT_IMPLEMENTATION, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())
      switch result
      case 0 { revert(0, returndatasize()) }
      default { return(0, returndatasize()) }
    }
  }

  /**
   * @dev The proxy account contract must be able to receive ether. 
   * Contracts that receive Ether directly but do not define a receive Ether function 
   * or a payable fallback function throw an exception, sending back the Ether. 
   */
  receive() external payable { }
}
