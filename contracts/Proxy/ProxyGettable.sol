// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ProxyConstant.sol";

/**
 * @dev Exposes getter functions for Proxy.sol and contracts that are intended to receive
 * delegatecall data from a Proxy instance.
 */
contract ProxyGettable is ProxyConstant {

  /**
   * @dev Returns the implementation address
   */
  function implementation() public view returns (address) {
    return _implementation();
  }

  /**
   * @dev Returns the proxy owner address
   */
  function proxyOwner() public view returns (address) {
    return _proxyOwner();
  }

  /**
   * @dev Internal function to read the implementation address
   */
  function _implementation() internal view returns (address impl) {
    bytes32 ptr = IMPLEMENTATION_PTR;
    assembly {
      impl := sload(ptr)
    }
  }

  /**
   * @dev Internal function to read the proxy owner address
   */
  function _proxyOwner() internal view returns (address owner) {
    bytes32 ptr = OWNER_PTR;
    assembly {
      owner := sload(ptr)
    }
  }

  /**
   * @dev Internal function to read the domain separator
   */
  function _domainSeparator() internal view returns (bytes32 domainSeparator) {
    bytes32 ptr = DOMAIN_SEPARATOR_PTR;
    assembly {
      domainSeparator := sload(ptr)
    }
  }
}
