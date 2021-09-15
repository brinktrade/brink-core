// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.6;

import "./ProxyStorage.sol";

/**
 * @dev Exposes setter functions for Proxy.sol and contracts that are intended to receive
 * delegatecall data from a Proxy instance.
 */
contract ProxySettable is ProxyStorage {
  /**
   * @dev Internal function to store the implementation contract address
   */
  function _setImplementation(address implementation) internal {
    _implementation = implementation;
  }

  /**
   * @dev Internal function to set the proxy owner address
   */
  function _setProxyOwner(address proxyOwner) internal {
    _owner = proxyOwner;
  }
}
