// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

/**
 * @dev internal storage for Proxy contracts
 */
contract ProxyStorage {
  /// @dev Address of the account implementation that deployed Proxy accounts will delegatecall to
  address constant ACCOUNT_IMPLEMENTATION = 0xb331835e919A1cfFbaAa40A68d59e0395798452C;

  address internal _owner;
}
