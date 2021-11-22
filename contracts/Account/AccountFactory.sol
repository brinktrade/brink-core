// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

import "../Proxy/Proxy.sol";

/// @title Brink account factory
/// @notice This is a factory contract used for deployment of Brink proxy accounts
contract AccountFactory {
  /// @dev Emit when a new Proxy account is deployed
  /// @param account Address of the new Proxy account
  event AccountDeployed(address account);

  /// @dev Salt used for salted deployment of Proxy accounts
  bytes32 constant SALT = 0x841eb53dae7d7c32f92a7e2a07956fb3b9b1532166bc47aa8f091f49bcaa9ff5;

  /// @dev Deploys a Proxy account for the given owner
  /// @param owner Address of the Proxy account owner
  /// @return account Address of the deployed Proxy account
  function deployAccount(address owner) external returns (address account) {
    account = address(new Proxy{salt: SALT}(owner));
    emit AccountDeployed(account);
  }
}
