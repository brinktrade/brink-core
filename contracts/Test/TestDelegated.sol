// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ITestDelegatedEvents.sol";

contract TestDelegated is ITestDelegatedEvents {
  bool private _called;

  function testNoReturn() external {
    _called = true;
    emit ExecutedTestCall();
  }

  function testReturn() external returns (uint num) {
    _called = true;
    num = 12345;
    emit ExecutedTestCall();
  }

  function testRevert(bool forceRevert) external {
    require(!forceRevert, "TestDelegated: reverted");
    _called = true;
    emit ExecutedTestCall();
  }

  function testTransferETH (uint256 amount, address recipient) external {
    bool success;
    (success, ) = recipient.call{value: amount}("");
    require(success, "TestDelegated: testTransferETH call failed");
  }

  function testEvent (uint256 mockUint, int24 mockInt, address mockAddress) external {
    emit MockParamsEvent(mockUint, mockInt, mockAddress);
  }
}