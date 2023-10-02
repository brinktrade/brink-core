// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

import "../Interfaces/ISingletonFactory.sol";

/// @title Deploys contracts using the canonical SingletonFactory and a hardcoded bytes32 salt. Includes custom events
/// and errors.
contract SaltedDeployer02 {
  /// @dev Emit when contract is deployed successfully
  event Deployed(address deployAddress);

  /// @dev Revert when SingletonFactory deploy returns 0 address
  error DeployFailed();

  /// @dev Revert when initCode is already deployed
  error DeploymentExists();

  /// @dev Canonical SingletonFactory address
  /// @notice https://eips.ethereum.org/EIPS/eip-2470
  ISingletonFactory constant SINGLETON_FACTORY = ISingletonFactory(0xce0042B868300000d44A59004Da54A005ffdcf9f);

  /// @dev Computes the salted deploy address of contract with initCode
  /// @return deployAddress Address where the contract with initCode will be deployed
  function getDeployAddress (bytes memory initCode, bytes32 salt) public pure returns (address deployAddress) {
    bytes32 hash = keccak256(
      abi.encodePacked(bytes1(0xff), address(SINGLETON_FACTORY), salt, keccak256(initCode))
    );
    deployAddress = address(uint160(uint(hash)));
  }

  /// @dev Deploys the contract with initCode
  /// @param initCode The initCode to deploy
  function deploy(bytes memory initCode, bytes32 salt) external {
    if (_isContract(getDeployAddress(initCode, salt))) {
      revert DeploymentExists();
    }
    address deployAddress = SINGLETON_FACTORY.deploy(initCode, salt);
    if (deployAddress == address(0)) {
      revert DeployFailed();
    }
    emit Deployed(deployAddress);
  }

  function _isContract(address account) internal view returns (bool) {
    return account.code.length > 0;
  }
}
