// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

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
   * @dev Internal function to add a proxy owner by storing `1` at the provided address
   */
  function _addProxyOwner(address proxyOwner) internal {
    bytes32 ptr = keccak256(abi.encodePacked("Proxy.owner", proxyOwner));
    assembly {
      sstore(ptr, 1)
    }
  }

  /**
   * @dev Internal function to remove a proxy owner by storing `0` at the provided address
   */
  function _removeProxyOwner(address proxyOwner) internal {
    bytes32 ptr = keccak256(abi.encodePacked("Proxy.owner", proxyOwner));
    assembly {
      sstore(ptr, 0)
    }
  }
}
