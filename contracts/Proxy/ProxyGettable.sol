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
   * @dev Returns a boolean indicating if `owner` is a proxy owner
   */
  function isProxyOwner(address owner) public view returns (bool) {
    return _isProxyOwner(owner);
  }

  /**
   * @dev Internal function to read the implementation address at constant the storage pointer
   */
  function _implementation() internal view returns (address impl) {
    bytes32 ptr = IMPLEMENTATION_PTR;
    assembly {
      impl := sload(ptr)
    }
  }

  /**
   * @dev Internal function to read the boolean value stored at `owner` address
   */
  function _isProxyOwner(address owner) internal view returns (bool isOwner) {
    bytes32 ptr = keccak256(abi.encodePacked("Proxy.owner", owner)); 
    assembly {
      isOwner := sload(ptr)
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
