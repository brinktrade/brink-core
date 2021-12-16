// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

/// @title Brink account factory
/// @notice This is a factory contract used for deployment of Brink proxy accounts
contract AccountFactory {
  error DeployFailed();

  /// @dev Deploys a Proxy account for the given owner
  /// @param owner Owner of the Proxy account
  /// @return account Address of the deployed Proxy account
  /// @notice This deploys a "minimal proxy" contract with the proxy owner address added to the deployed bytecode. The
  /// owner address can be read within a delegatecall by using `extcodecopy`. Minimal proxy bytecode is from
  /// https://medium.com/coinmonks/the-more-minimal-proxy-5756ae08ee48 and https://eips.ethereum.org/EIPS/eip-1167. It
  /// utilizes the "vanity address optimization" from EIP 1167
  function deployAccount(address owner) external returns (address account) {
    bytes memory initCode = abi.encodePacked(
      //  [* constructor **] [** minimal proxy ***] [******** implementation ********] [**** minimal proxy *****]
      hex'603d3d8160093d39f3_3d3d3d3d363d3d37363d70_77efe7d0b63912c990fd6586087240e09e_5af43d3d93803e602757fd5bf3',
      owner
    );
    assembly {
      account := create2(0, add(initCode, 0x20), mload(initCode), 0)
    }
    if(account == address(0)) {
      revert DeployFailed();
    }
  }
}
