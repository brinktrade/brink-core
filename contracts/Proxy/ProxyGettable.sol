// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

/**
 * @dev Exposes proxyOwner() view function for contracts that are intended to receive
 * delegatecall data from a Proxy instance.
 */
abstract contract ProxyGettable {
  /**
   * @dev Returns the proxy owner address
   * @notice When run by a Proxy.sol delegatecall, this function returns the value of the OWNER constant
   */
  function proxyOwner() public view returns (address _proxyOwner) {
    assembly {
      extcodecopy(address(), mload(0x40), 0x0A, 0x14)
      _proxyOwner := mload(sub(mload(0x40), 0x0C))
    }
  }
}
