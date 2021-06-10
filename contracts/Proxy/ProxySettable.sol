// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

import "./ProxyConstant.sol";

/**
 * @dev Exposes setter functions for Proxy.sol and contracts that are intended to receive
 * delegatecall data from a Proxy instance.
 */
contract ProxySettable is ProxyConstant {

  /**
   * @dev Internal function to store the implementation contract address
   */
  function _setImplementation(address implementation) internal {
    bytes32 ptr = IMPLEMENTATION_PTR;
    assembly {
      sstore(ptr, implementation)
    }
  }

  /**
   * @dev Internal function to set the proxy owner address
   */
  function _setProxyOwner(address proxyOwner) internal {
    bytes32 ptr = OWNER_PTR;
    assembly {
      sstore(ptr, proxyOwner)
    }
  }
}
