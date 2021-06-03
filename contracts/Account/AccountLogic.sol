// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../Called/CallExecutable.sol";
import "../MetaTransactions/MetaCallLogic.sol";
import "../MetaTransactions/MetaCancelLogic.sol";

/**
 * @dev Logic for all account functionality.
 *
 * Deployed once. Used as the "implementation" address for many Proxy contracts
 * that are owned by users.
 */
contract AccountLogic is CallExecutable, MetaCallLogic, MetaCancelLogic {

  /** 
   * @dev Stores the address of a CallExecutor contract. CallExecutor is used
   * as a call proxy to ensure that msg.sender is not the account address
   */
  constructor(CallExecutor callExecutor) {
    _setCallExecutor(callExecutor);
  }

}
