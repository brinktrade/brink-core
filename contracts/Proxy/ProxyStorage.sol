// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

/**
 * @dev internal storage for Proxy contracts
 */
contract ProxyStorage {
  /// @dev Address of the account implementation that deployed Proxy accounts will delegatecall to
  address constant ACCOUNT_IMPLEMENTATION = 0x1a015312312c5508E077bAde7881F553aC44f288;

  /// @dev Placeholder address for the proxy owner, replaced with the actual owner before deployment
  address constant OWNER = 0xfefeFEFeFEFEFEFEFeFefefefefeFEfEfefefEfe;           
}
