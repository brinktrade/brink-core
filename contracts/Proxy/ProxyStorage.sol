// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

/**
 * @dev internal storage for Proxy contracts
 */
contract ProxyStorage {
  address internal _implementation;
  address internal _owner;
}
