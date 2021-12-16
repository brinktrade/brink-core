// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

/// @title Brink account factory
/// @notice This is a factory contract used for deployment of Brink proxy accounts
contract AccountFactory {
  /// @dev Deploys a Proxy account for the given owner
  /// @param owner Owner of the Proxy account
  /// @return account Address of the deployed Proxy account
  /// @notice This deploys a "minimal proxy" contract with the proxy owner address added to the deployed bytecode. The
  /// owner address can be read within a delegatecall by using `extcodecopy`. Minimal proxy bytecode is from
  /// https://medium.com/coinmonks/the-more-minimal-proxy-5756ae08ee48 and https://eips.ethereum.org/EIPS/eip-1167. It
  /// utilizes the "vanity address optimization" from EIP 1167
  function deployAccount(address owner) external returns (address account) {
    bytes memory initCode = abi.encodePacked(
      //  [* constructor **] [** minimal proxy ***] [********* implementation *********] [**** minimal proxy *****]
      hex'603e3d8160093d39f3_3d3d3d3d363d3d37363d71_f673cb919a0d37a55a20263b490614eed150_5af43d3d93803e602857fd5bf3',
      owner
    );
    assembly {
      account := create2(0, add(initCode, 0x20), mload(initCode), 0)
    }
  }
}
