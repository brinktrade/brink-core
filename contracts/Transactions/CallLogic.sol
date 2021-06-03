// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "../Proxy/ProxyGettable.sol";

/// @author Brink
/// @title Call Logic for Meta Account
contract CallLogic is ProxyGettable {
  
  /// Call to external contract
  /// @param value Eth value in wei
  /// @param to Address of the external contract
  /// @param data Call data to execute on the external contract
  function externalCall(
    uint256 value, 
    address to, 
    bytes memory data
  ) 
    public 
  {
    require(_isProxyOwner(msg.sender), "CallLogic: externalCall msg.sender is not proxyOwner");
    assembly {
      let result := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  /// Delegate call without value to external contract
  /// @param to Address of the external contract
  /// @param data Call data to execute on the external contract
  function delegateCall(
    address to, 
    bytes memory data
  ) 
    public 
  {
    require(_isProxyOwner(msg.sender), "CallLogic: delegateCall msg.sender is not proxyOwner");
    assembly {
      let result := delegatecall(gas(), to, add(data, 0x20), mload(data), 0, 0)
      if eq(result, 0) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }
}