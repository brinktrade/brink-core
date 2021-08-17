// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

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
  * @dev The constructor sets the `implementation` contract address and the initial `proxyOwner`
  */
  constructor(address implementation, address proxyOwner) {
    _implementation = implementation;
    _owner = proxyOwner;
  }

 /**
  * @dev Fallback function 
  */
  fallback() external payable {
    _delegate(_implementation);
  }

  /**
   * @dev performs a delegatecall to the implementation contract.
   * This function will return whatever the implementation call returns, or revert
   * if the implementation call reverts.
   */
  function _delegate(address impl) internal {
    assembly {
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())
      switch result
      case 0 { revert(0, returndatasize()) }
      default { return(0, returndatasize()) }
    }
  }

  receive() external payable { }
}
