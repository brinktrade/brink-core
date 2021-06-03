// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./CallExecutor.sol";
import "./CallExecutableConstant.sol";

/**
 * @dev Exposes callExecutor() function to read the address of the CallExecutor
 * stored at _callExecutorPtr
 */
contract CallExecutable is CallExecutableConstant {

  /**
   * @dev returns the address of the CallExecutor
   */
  function callExecutor() public view returns (CallExecutor _callExecutor) {
    assembly {
      _callExecutor := sload(_callExecutorPtr)
    }
  }

  /**
   * @dev sets the address of the CallExecutor
   */
  function _setCallExecutor(CallExecutor _callExecutor) internal {
    assembly {
      sstore(_callExecutorPtr, _callExecutor)
    }
  }

}
