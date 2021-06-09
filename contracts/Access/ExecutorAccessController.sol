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

  /// @dev max executors per admin
  uint8 public maxExecutorsPerAdmin = 10;

  /// @dev admin address -> number of active validators
  mapping(address => uint8) public numAdminExecutors;

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

  /// @dev Modifys the max number of executors per admin
  /// @param _maxExecutorsPerAdmin The new max number of executors per admin
  function modifyMaxExecutorsPerAdmin(uint8 _maxExecutorsPerAdmin) external onlyOwner {
    maxExecutorsPerAdmin = _maxExecutorsPerAdmin
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
    require(numAdminExecutors[msg.sender] <= maxExecutorsPerAdmin);
    _addExecutor(executor);
    numAdminExecutors[msg.sender] += 1;
  }

  /// @dev Adds an executor without requiring a signature
  /// @notice Only the owner can add an executor without requiring a signature
  /// @param executor The executor address
  function addExecutorWithoutSignature(address executor) external onlyOwner {
    _addExecutor(executor);
  }

  /// @dev Helper function that handles adding an executor
  function _addExecutor(address executor) internal {
    executorAdmins[executor] = msg.sender;
    executors[executor] = true;
  } 

  /// @dev Removes an executor
  /// @notice Only the admin that added the executor can remove it
  /// @param executor The executor address
  function removeExecutor(address executor) external {
    require(executorAdmins[executor] == msg.sender || owner == msg.sender, "NOT_EXECUTOR_OWNER");
    if (executorAdmins[executor] != owner) {
      numAdminExecutors[executorAdmins[executor]] -= 1;
    }
    executors[executor] = false;
    executorAdmins[executor] = address(0);
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
