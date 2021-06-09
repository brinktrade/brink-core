// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

/// @author Brink
/// @title Executor access controller for Brink transactions
contract ExecutorAccessController {

  /// @dev owner of the contract
  address public owner;

  /// @dev executor address -> boolean
  mapping(address => bool) public executors;

  /// @dev admin address -> boolean
  mapping(address => bool) public admins;

  /// @dev executor address -> admin address
  mapping(address => address) public executorAdmins;

  /// @dev modifier, checks address is the Owner
  modifier onlyOwner {
    require(msg.sender == owner, "NOT_CONTRACT_OWNER");
    _;
  }

  /// @dev modifier, checks address is an Admin
  modifier onlyAdmin {
    require(admins[msg.sender], "NOT_ADMIN");
    _;
  }

  /// @dev Stores the address of the owner of the ExecutorAccessController
  /// @param _owner The owner of the ExecutorAccessController
  constructor(address _owner) {
    owner = _owner;
  }

  /// @dev Adds an admin
  /// @param admin The admin address
  function addAdmin(address admin) external onlyOwner {
    admins[admin] = true;
  }

  /// @dev Removes an admin
  /// @param admin The admin address
  function removeAdmin(address admin) external onlyOwner {
    admins[admin] = false;
  }

  /// @dev Adds an executor
  /// @notice Only admins can add executors
  /// @param executor The executor address
  function addExecutor(address executor) external onlyAdmin {
    require(executorAdmins[executor] == address(0), "EXECUTOR_EXISTS");
    executorAdmins[executor] = msg.sender;
    executors[executor] = true;
  }

  /// @dev Removes an executor
  /// @notice Only the admin that added the executor can remove it
  /// @param executor The executor address
  function removeExecutor(address executor) external {
    require(executorAdmins[executor] == msg.sender || owner == msg.sender, "NOT_EXECUTOR_OWNER");
    executorAdmins[executor] = address(0);
    executors[executor] = false;
  }

  /// @dev Returns true if the address is an executor
  /// @param executor The executor address
  /// @return Whether the address is an executor
  function isExecutor(address executor) external view returns(bool) {
    return executors[executor];
  }

  /// @dev Returns true if the address is an admin
  /// @param admin The admin address
  /// @return Whether the address is an admin
  function isAdmin(address admin) external view returns(bool) {
    return admins[admin];
  }
}
