// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "../Account/EIP712SignerRecovery.sol";

/// @author Brink
/// @title Executor access controller for Brink transactions
contract ExecutorAccessController is EIP712SignerRecovery {

  /// @dev Typehash for signed addExecutor() messages
  /// @dev keccak256("AddExecutor(address executor)")
  bytes32 internal constant ADD_EXECUTOR_TYPEHASH = 0xe4e366336879e9d2c1ad5275c1912d69c53200255a6fdecc42f19a6b05701d56;

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

  /// @dev Stores the address of the owner and stores the domain separator
  /// @param _owner The owner of the ExecutorAccessController
  /// @param chainId_ Included in domain separator to ensure that EIP-712 can't be replayed on other chains
  constructor(address _owner, uint256 chainId_) {
    owner = _owner;
    _storeDomainSeparator("ExecutorAccessController", "1", chainId_);
  }

  /// @dev Modifys the max number of executors per admin
  /// @param _maxExecutorsPerAdmin The new max number of executors per admin
  function modifyMaxExecutorsPerAdmin(uint8 _maxExecutorsPerAdmin) external onlyOwner {
    maxExecutorsPerAdmin = _maxExecutorsPerAdmin;
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
  /// @param signature Signed message from the executor address, to verify that it's an EOA
  function addExecutor(address executor, bytes memory signature) external onlyAdmin {
    require(
      _recoverSigner(keccak256(abi.encode(ADD_EXECUTOR_TYPEHASH, executor)), signature) == executor,
      "SIGNER_NOT_EXECUTOR"
    );
    require(executorAdmins[executor] == address(0), "EXECUTOR_EXISTS");
    require(numAdminExecutors[msg.sender] <= maxExecutorsPerAdmin, "EXECUTOR_LIMIT_HIT");
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
