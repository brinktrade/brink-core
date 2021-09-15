// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.6;

import "./ProxyStorage.sol";

/**
 * @dev Exposes getter functions for Proxy.sol and contracts that are intended to receive
 * delegatecall data from a Proxy instance.
 */
contract ProxyGettable is ProxyStorage {
  /**
   * @dev Returns the implementation address
   */
  function implementation() public view returns (address) {
    return _implementation;
  }

  /**
   * @dev Returns the proxy owner address
   */
  function proxyOwner() public view returns (address) {
    return _owner;
  }
}
